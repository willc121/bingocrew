import cardsRouter from "./api/cards";

import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Auth setup
  await setupAuth(app);
  registerAuthRoutes(app);

  // === Groups ===
  app.get(api.groups.list.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user!.claims.sub;
    const groups = await storage.getUserGroups(userId);
    res.json(groups);
  });

  app.post(api.groups.create.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user!.claims.sub;
    try {
      const input = api.groups.create.input.parse(req.body);
      const group = await storage.createGroup({ ...input, ownerId: userId });
      res.status(201).json(group);
    } catch (e) {
      if (e instanceof z.ZodError) return res.status(400).json(e.errors);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.get(api.groups.get.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user!.claims.sub;
    const groupId = req.params.id;

    const groups = await storage.getUserGroups(userId);
    if (!groups.find(g => g.id === groupId)) {
      return res.status(404).json({ message: "Group not found or access denied" });
    }

    const group = await storage.getGroup(groupId);
    const members = await storage.getGroupMembers(groupId);
    const card = await storage.getGroupCard(groupId);
    const progress = card ? await storage.getProgressByCard(card.id, userId) : null;
    const events = await storage.getGroupEvents(groupId);
    
    // Get all progress for leaderboard (for shared cards)
    const allProgress = card ? await storage.getAllProgressByCard(card.id) : [];
    
    // For individual groups, get linked cards so members can view each other's
    const linkedCards = group?.cardType === "individual" ? await storage.getLinkedCardsForGroup(groupId) : [];

    res.json({
      ...group,
      members,
      activeCard: card,
      myProgress: progress,
      allProgress,
      linkedCards,
      events
    });
  });

  app.post(api.groups.join.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user!.claims.sub;
    const { code } = req.body;
    
    const invite = await storage.getInvite(code);
    if (!invite) {
      return res.status(404).json({ message: "Invalid invite code" });
    }
    
    if (invite.expiresAt && new Date() > invite.expiresAt) {
      return res.status(400).json({ message: "Invite expired" });
    }

    await storage.addMember(invite.groupId, userId);
    res.json({ groupId: invite.groupId });
  });

  app.post(api.groups.createInvite.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user!.claims.sub;
    const groupId = req.params.id;
    
    const members = await storage.getGroupMembers(groupId);
    const me = members.find(m => m.userId === userId);
    if (!me) return res.status(403).json({ message: "Not a member" });
    
    const code = await storage.createInvite(groupId, userId);
    res.status(201).json({ code, expiresAt: null });
  });

  app.post(api.groups.leave.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user!.claims.sub;
    const groupId = req.params.id;
    
    const group = await storage.getGroup(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });
    
    if (group.ownerId === userId) {
      return res.status(403).json({ message: "Owners cannot leave their group. Transfer ownership first or delete the group." });
    }
    
    await storage.removeMember(groupId, userId);
    res.json({ success: true });
  });

  app.put(api.groups.update.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user!.claims.sub;
    const groupId = req.params.id;
    
    const group = await storage.getGroup(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });
    
    if (group.ownerId !== userId) {
      return res.status(403).json({ message: "Only the owner can update the group" });
    }
    
    try {
      const input = api.groups.update.input.parse(req.body);
      const updated = await storage.updateGroup(groupId, input);
      res.json(updated);
    } catch (e) {
      if (e instanceof z.ZodError) return res.status(400).json(e.errors);
      res.status(500).json({ message: "Error updating group" });
    }
  });
  
  app.delete(api.groups.delete.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user!.claims.sub;
    const groupId = req.params.id;
    
    const group = await storage.getGroup(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });
    
    if (group.ownerId !== userId) {
      return res.status(403).json({ message: "Only the owner can delete the group" });
    }
    
    await storage.deleteGroup(groupId);
    res.status(204).send();
  });
  
  app.post(api.groups.linkCard.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user!.claims.sub;
    const groupId = req.params.id;
    const { cardId } = req.body;
    
    const group = await storage.getGroup(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });
    
    const members = await storage.getGroupMembers(groupId);
    const me = members.find(m => m.userId === userId);
    if (!me) return res.status(403).json({ message: "Not a member" });
    
    try {
      const card = await storage.linkCardToGroup(groupId, cardId, userId);
      res.json(card);
    } catch (e: any) {
      res.status(400).json({ message: e.message || "Failed to link card" });
    }
  });

  // === Group Card ===
  app.put(api.card.update.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user!.claims.sub;
    const groupId = req.params.id;
    
    const members = await storage.getGroupMembers(groupId);
    const me = members.find(m => m.userId === userId);
    if (!me || (me.role !== 'owner' && me.role !== 'admin')) {
      return res.status(403).json({ message: "Only admins can update the card" });
    }

    try {
      const input = api.card.update.input.parse(req.body);
      const card = await storage.upsertGroupCard(groupId, input.title, input.items);
      res.json(card);
    } catch (e) {
      if (e instanceof z.ZodError) return res.status(400).json(e.errors);
      res.status(500).json({ message: "Error updating card" });
    }
  });

  // === Group Progress ===
  app.post(api.progress.toggle.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user!.claims.sub;
    const groupId = req.params.id;
    const { squareIndex, completed } = req.body;

    try {
      const result = await storage.toggleSquare(groupId, userId, squareIndex, completed);
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ message: e.message || "Error toggling square" });
    }
  });

  // === Personal Cards (Solo Mode) ===
  app.get(api.myCards.list.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user!.claims.sub;
    const cards = await storage.getUserPersonalCards(userId);
    
    // Attach progress to each card
    const cardsWithProgress = await Promise.all(cards.map(async (card) => {
      const progress = await storage.getProgressByCard(card.id, userId);
      return { ...card, progress };
    }));
    
    res.json(cardsWithProgress);
  });

  app.post(api.myCards.create.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user!.claims.sub;
    try {
      const input = api.myCards.create.input.parse(req.body);
      const { completedIndices, ...cardData } = input;
      const card = await storage.createPersonalCard(userId, cardData);
      
      // If migrating from local with existing progress, set the progress
      if (completedIndices && completedIndices.length > 0) {
        await storage.setProgress(card.id, userId, completedIndices);
      }
      
      res.status(201).json(card);
    } catch (e) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: e.errors[0].message });
      res.status(500).json({ message: "Error creating card" });
    }
  });

  // Trash - get deleted cards (MUST be before :id route to avoid "trash" being parsed as UUID)
  app.get(api.myCards.trash.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user!.claims.sub;
    const trashedCards = await storage.getTrashedCards(userId);
    res.json(trashedCards);
  });

  app.get(api.myCards.get.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user!.claims.sub;
    const cardId = req.params.id;
    
    const card = await storage.getCard(cardId);
    if (!card || card.ownerId !== userId || card.deletedAt) {
      return res.status(404).json({ message: "Card not found" });
    }
    
    const progress = await storage.getProgressByCard(cardId, userId);
    res.json({ ...card, progress });
  });

  app.put(api.myCards.update.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user!.claims.sub;
    const cardId = req.params.id;
    
    const card = await storage.getCard(cardId);
    if (!card || card.ownerId !== userId || card.deletedAt) {
      return res.status(404).json({ message: "Card not found" });
    }

    try {
      const input = api.myCards.update.input.parse(req.body);
      const updated = await storage.updatePersonalCard(cardId, input);
      res.json(updated);
    } catch (e) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: e.errors[0].message });
      res.status(500).json({ message: "Error updating card" });
    }
  });

  app.delete(api.myCards.delete.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user!.claims.sub;
    const cardId = req.params.id;
    
    const card = await storage.getCard(cardId);
    if (!card || card.ownerId !== userId || card.deletedAt) {
      return res.status(404).json({ message: "Card not found" });
    }

    await storage.deletePersonalCard(cardId);
    res.status(204).send();
  });

  app.post(api.myCards.toggle.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user!.claims.sub;
    const cardId = req.params.id;
    const { squareIndex, completed } = req.body;
    
    const card = await storage.getCard(cardId);
    if (!card || card.ownerId !== userId || card.deletedAt) {
      return res.status(404).json({ message: "Card not found" });
    }

    // Pass groupId if card is linked to a group (for activity tracking)
    const result = await storage.toggleSquareOnCard(cardId, userId, squareIndex, completed, card.groupId || undefined);
    res.json(result);
  });

  // Restore a deleted card
  app.post(api.myCards.restore.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user!.claims.sub;
    const cardId = req.params.id;
    
    const card = await storage.getCard(cardId);
    if (!card || card.ownerId !== userId) {
      return res.status(404).json({ message: "Card not found" });
    }

    const restored = await storage.restorePersonalCard(cardId);
    res.json(restored);
  });

  // Permanently delete a card
  app.delete(api.myCards.permanentDelete.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user!.claims.sub;
    const cardId = req.params.id;
    
    const card = await storage.getCard(cardId);
    if (!card || card.ownerId !== userId) {
      return res.status(404).json({ message: "Card not found" });
    }

    await storage.permanentlyDeleteCard(cardId);
    res.status(204).send();
  });

  // === Notifications ===
  app.get(api.notifications.list.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user!.claims.sub;
    const notifications = await storage.getUserNotifications(userId);
    res.json(notifications);
  });

  app.patch(api.notifications.markRead.path, isAuthenticated, async (req: any, res) => {
    await storage.markNotificationRead(req.params.id);
    res.json({ success: true });
  });

  return httpServer;
}
