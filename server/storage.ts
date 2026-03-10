import { db } from "./db";
import { 
  groups, groupMembers, groupInvites, cards, progress, events, notifications, users,
  type Group, type GroupMember, type Card, type Progress, type Event, type Notification,
  type CreateGroupRequest, type CreatePersonalCardRequest, type BingoItem, WINNING_LINES
} from "@shared/schema";
import { eq, and, desc, isNull, isNotNull } from "drizzle-orm";
import { randomBytes } from "crypto";

export interface IStorage {
  // Groups
  createGroup(group: CreateGroupRequest & { ownerId: string }): Promise<Group>;
  getGroup(id: string): Promise<Group | undefined>;
  getUserGroups(userId: string): Promise<Group[]>;
  getGroupMembers(groupId: string): Promise<GroupMember[]>;
  updateGroup(groupId: string, data: { name?: string; emoji?: string; cardType?: string }): Promise<Group>;
  deleteGroup(groupId: string): Promise<void>;
  removeMember(groupId: string, userId: string): Promise<void>;
  linkCardToGroup(groupId: string, cardId: string, userId: string): Promise<Card>;
  
  // Invites
  createInvite(groupId: string, userId: string): Promise<string>;
  getInvite(code: string): Promise<{ groupId: string, expiresAt: Date | null } | undefined>;
  addMember(groupId: string, userId: string, role?: "owner" | "admin" | "member"): Promise<void>;
  
  // Group Cards
  getGroupCard(groupId: string): Promise<Card | undefined>;
  upsertGroupCard(groupId: string, title: string, items: BingoItem[]): Promise<Card>;
  
  // Personal Cards
  getUserPersonalCards(userId: string): Promise<Card[]>;
  getTrashedCards(userId: string): Promise<Card[]>;
  getCard(cardId: string): Promise<Card | undefined>;
  createPersonalCard(userId: string, data: CreatePersonalCardRequest): Promise<Card>;
  updatePersonalCard(cardId: string, data: Partial<CreatePersonalCardRequest>): Promise<Card>;
  deletePersonalCard(cardId: string): Promise<void>;
  restorePersonalCard(cardId: string): Promise<Card>;
  permanentlyDeleteCard(cardId: string): Promise<void>;
  
  // Progress
  getProgressByCard(cardId: string, userId: string): Promise<Progress | undefined>;
  getAllProgressByCard(cardId: string): Promise<Progress[]>;
  toggleSquareOnCard(cardId: string, userId: string, squareIndex: number, completed: boolean, groupId?: string): Promise<{ progress: Progress, newBingo: boolean }>;
  setProgress(cardId: string, userId: string, completedIndices: number[]): Promise<Progress>;
  
  // Linked cards for individual groups
  getLinkedCardsForGroup(groupId: string): Promise<(Card & { progress?: Progress })[]>;
  
  // Legacy group progress (for backwards compat)
  getProgress(groupId: string, userId: string): Promise<Progress | undefined>;
  toggleSquare(groupId: string, userId: string, squareIndex: number, completed: boolean): Promise<{ progress: Progress, newBingo: boolean }>;
  
  // Events & Notifications
  getGroupEvents(groupId: string): Promise<Event[]>;
  getUserNotifications(userId: string): Promise<Notification[]>;
  markNotificationRead(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // === Groups ===
  async createGroup(group: CreateGroupRequest & { ownerId: string }): Promise<Group> {
    const [newGroup] = await db.insert(groups).values(group).returning();
    await this.addMember(newGroup.id, group.ownerId, "owner");
    return newGroup;
  }

  async getGroup(id: string): Promise<Group | undefined> {
    const [group] = await db.select().from(groups).where(and(eq(groups.id, id), isNull(groups.deletedAt)));
    return group;
  }

  async getUserGroups(userId: string): Promise<Group[]> {
    const userGroups = await db.select({
      id: groups.id,
      name: groups.name,
      emoji: groups.emoji,
      theme: groups.theme,
      ownerId: groups.ownerId,
      cardLocked: groups.cardLocked,
      cardType: groups.cardType,
      createdAt: groups.createdAt,
      deletedAt: groups.deletedAt
    })
    .from(groups)
    .innerJoin(groupMembers, eq(groups.id, groupMembers.groupId))
    .where(and(eq(groupMembers.userId, userId), isNull(groups.deletedAt)));
    
    return userGroups;
  }

  async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    const members = await db.select({
      id: groupMembers.id,
      groupId: groupMembers.groupId,
      userId: groupMembers.userId,
      role: groupMembers.role,
      joinedAt: groupMembers.joinedAt,
      user: users
    })
    .from(groupMembers)
    .innerJoin(users, eq(groupMembers.userId, users.id))
    .where(eq(groupMembers.groupId, groupId));
    
    return members;
  }

  // === Invites ===
  async createInvite(groupId: string, userId: string): Promise<string> {
    const code = randomBytes(4).toString('hex').toUpperCase();
    await db.insert(groupInvites).values({
      groupId,
      code,
      createdBy: userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });
    return code;
  }

  async getInvite(code: string): Promise<{ groupId: string, expiresAt: Date | null } | undefined> {
    const [invite] = await db.select().from(groupInvites).where(eq(groupInvites.code, code));
    if (!invite) return undefined;
    return { groupId: invite.groupId, expiresAt: invite.expiresAt };
  }

  async addMember(groupId: string, userId: string, role: "owner" | "admin" | "member" = "member"): Promise<void> {
    const [existing] = await db.select().from(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)));
    
    if (existing) return;

    await db.insert(groupMembers).values({ groupId, userId, role });
    await db.insert(events).values({ groupId, userId, type: "joined_group" });
  }

  // === Group Cards ===
  async getGroupCard(groupId: string): Promise<Card | undefined> {
    const [card] = await db.select().from(cards).where(eq(cards.groupId, groupId));
    return card;
  }

  async upsertGroupCard(groupId: string, title: string, items: BingoItem[]): Promise<Card> {
    // Check if card exists
    const existing = await this.getGroupCard(groupId);
    if (existing) {
      const [updated] = await db.update(cards).set({ title, items, updatedAt: new Date() })
        .where(eq(cards.id, existing.id)).returning();
      return updated;
    }
    const [card] = await db.insert(cards).values({ groupId, title, items }).returning();
    return card;
  }

  // === Personal Cards ===
  async getUserPersonalCards(userId: string): Promise<Card[]> {
    return await db.select().from(cards)
      .where(and(eq(cards.ownerId, userId), isNull(cards.deletedAt)))
      .orderBy(desc(cards.createdAt));
  }

  async getTrashedCards(userId: string): Promise<Card[]> {
    return await db.select().from(cards)
      .where(and(eq(cards.ownerId, userId), isNotNull(cards.deletedAt)))
      .orderBy(desc(cards.deletedAt));
  }

  async getCard(cardId: string): Promise<Card | undefined> {
    const [card] = await db.select().from(cards).where(eq(cards.id, cardId));
    return card;
  }

  async createPersonalCard(userId: string, data: CreatePersonalCardRequest): Promise<Card> {
    const [card] = await db.insert(cards).values({
      ownerId: userId,
      groupId: null,
      title: data.title,
      theme: data.theme || 'default',
      items: data.items
    }).returning();
    return card;
  }

  async updatePersonalCard(cardId: string, data: Partial<CreatePersonalCardRequest>): Promise<Card> {
    const updateData: any = { updatedAt: new Date() };
    if (data.title) updateData.title = data.title;
    if (data.theme) updateData.theme = data.theme;
    if (data.items) updateData.items = data.items;
    
    const [card] = await db.update(cards).set(updateData)
      .where(eq(cards.id, cardId)).returning();
    return card;
  }

  async deletePersonalCard(cardId: string): Promise<void> {
    // Soft delete - set deletedAt timestamp
    await db.update(cards).set({ deletedAt: new Date() }).where(eq(cards.id, cardId));
  }

  async restorePersonalCard(cardId: string): Promise<Card> {
    const [card] = await db.update(cards).set({ deletedAt: null }).where(eq(cards.id, cardId)).returning();
    return card;
  }

  async permanentlyDeleteCard(cardId: string): Promise<void> {
    // Delete progress first
    await db.delete(progress).where(eq(progress.cardId, cardId));
    // Delete events
    await db.delete(events).where(eq(events.cardId, cardId));
    // Delete card
    await db.delete(cards).where(eq(cards.id, cardId));
  }

  // === Progress ===
  async getProgressByCard(cardId: string, userId: string): Promise<Progress | undefined> {
    const [p] = await db.select().from(progress)
      .where(and(eq(progress.cardId, cardId), eq(progress.userId, userId)));
    return p;
  }

  async getAllProgressByCard(cardId: string): Promise<Progress[]> {
    return await db.select().from(progress).where(eq(progress.cardId, cardId));
  }

  async setProgress(cardId: string, userId: string, completedIndices: number[]): Promise<Progress> {
    // Ensure center (12) is always included
    const indices = completedIndices.includes(12) ? completedIndices : [...completedIndices, 12];
    
    const timestamps: Record<number, string> = {};
    const now = new Date().toISOString();
    indices.forEach(i => { timestamps[i] = now; });
    
    // Calculate bingo count
    const bingoCount = WINNING_LINES.filter(line => line.every(i => indices.includes(i))).length;
    
    const [existing] = await db.select().from(progress)
      .where(and(eq(progress.cardId, cardId), eq(progress.userId, userId)));
    
    if (existing) {
      const [updated] = await db.update(progress)
        .set({ completedIndices: indices, completedAt: timestamps, bingoCount })
        .where(eq(progress.id, existing.id))
        .returning();
      return updated;
    }
    
    const [newProgress] = await db.insert(progress).values({
      cardId,
      userId,
      groupId: null,
      completedIndices: indices,
      completedAt: timestamps,
      bingoCount
    }).returning();
    
    return newProgress;
  }

  async getLinkedCardsForGroup(groupId: string): Promise<(Card & { progress?: Progress })[]> {
    const linkedCards = await db.select().from(cards)
      .where(and(eq(cards.groupId, groupId), isNull(cards.deletedAt)));
    
    const cardsWithProgress = await Promise.all(linkedCards.map(async (card) => {
      if (!card.ownerId) return { ...card, progress: undefined };
      const [cardProgress] = await db.select().from(progress)
        .where(and(eq(progress.cardId, card.id), eq(progress.userId, card.ownerId)));
      return { ...card, progress: cardProgress };
    }));
    
    return cardsWithProgress;
  }

  async toggleSquareOnCard(cardId: string, userId: string, squareIndex: number, completed: boolean, groupId?: string): Promise<{ progress: Progress, newBingo: boolean }> {
    let [userProgress] = await db.select().from(progress)
      .where(and(eq(progress.cardId, cardId), eq(progress.userId, userId)));

    if (!userProgress) {
      [userProgress] = await db.insert(progress).values({
        cardId,
        userId,
        groupId: groupId || null,
        completedIndices: [],
        completedAt: {},
        bingoCount: 0
      }).returning();
    }

    let indices = userProgress.completedIndices || [];
    let timestamps = userProgress.completedAt as Record<number, string> || {};
    
    // Center (12) is always free
    if (!indices.includes(12)) {
      indices.push(12);
      timestamps[12] = new Date().toISOString();
    }

    if (completed && !indices.includes(squareIndex)) {
      indices.push(squareIndex);
      timestamps[squareIndex] = new Date().toISOString();
    } else if (!completed && indices.includes(squareIndex)) {
      indices = indices.filter(i => i !== squareIndex);
      delete timestamps[squareIndex];
    }

    // Check for Bingos
    let bingoCount = 0;
    const completedSet = new Set(indices);
    for (const line of WINNING_LINES) {
      if (line.every(i => completedSet.has(i))) {
        bingoCount++;
      }
    }

    const newBingo = bingoCount > (userProgress.bingoCount || 0);

    const [updatedProgress] = await db.update(progress).set({
      completedIndices: indices,
      completedAt: timestamps,
      bingoCount,
      lastUpdated: new Date()
    })
    .where(eq(progress.id, userProgress.id))
    .returning();

    // Only create events/notifications for group cards
    if (groupId && completed) {
      const [event] = await db.insert(events).values({
        groupId,
        cardId,
        userId,
        type: "completed_square",
        payload: { squareIndex }
      }).returning();
      await this.notifyGroupMembers(groupId, userId, event.id);
    }

    if (groupId && newBingo) {
      const [event] = await db.insert(events).values({
        groupId,
        cardId,
        userId,
        type: "bingo",
        payload: { line: "New Bingo!" }
      }).returning();
      await this.notifyGroupMembers(groupId, userId, event.id);
    }

    return { progress: updatedProgress, newBingo };
  }

  // Legacy methods for backwards compat
  async getProgress(groupId: string, userId: string): Promise<Progress | undefined> {
    // Get group card first
    const card = await this.getGroupCard(groupId);
    if (!card) return undefined;
    return this.getProgressByCard(card.id, userId);
  }

  async toggleSquare(groupId: string, userId: string, squareIndex: number, completed: boolean): Promise<{ progress: Progress, newBingo: boolean }> {
    const card = await this.getGroupCard(groupId);
    if (!card) throw new Error("No card found for group");
    return this.toggleSquareOnCard(card.id, userId, squareIndex, completed, groupId);
  }

  private async notifyGroupMembers(groupId: string, actorId: string, eventId: string) {
    const members = await this.getGroupMembers(groupId);
    const others = members.filter(m => m.userId !== actorId);
    
    if (others.length === 0) return;

    await db.insert(notifications).values(
      others.map(m => ({
        userId: m.userId,
        groupId,
        eventId,
        read: false
      }))
    );
  }

  async getGroupEvents(groupId: string): Promise<Event[]> {
    const eventsWithUsers = await db.select({
      id: events.id,
      groupId: events.groupId,
      cardId: events.cardId,
      userId: events.userId,
      type: events.type,
      payload: events.payload,
      createdAt: events.createdAt,
      user: {
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
      }
    })
      .from(events)
      .leftJoin(users, eq(events.userId, users.id))
      .where(eq(events.groupId, groupId))
      .orderBy(desc(events.createdAt))
      .limit(50);
    return eventsWithUsers;
  }
  
  async removeMember(groupId: string, userId: string): Promise<void> {
    await db.delete(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)));
  }
  
  async updateGroup(groupId: string, data: { name?: string; emoji?: string; cardType?: string }): Promise<Group> {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.emoji !== undefined) updateData.emoji = data.emoji;
    if (data.cardType !== undefined) updateData.cardType = data.cardType;
    
    const [updated] = await db.update(groups)
      .set(updateData)
      .where(eq(groups.id, groupId))
      .returning();
    return updated;
  }
  
  async deleteGroup(groupId: string): Promise<void> {
    await db.update(groups).set({ deletedAt: new Date() }).where(eq(groups.id, groupId));
  }
  
  async linkCardToGroup(groupId: string, cardId: string, userId: string): Promise<Card> {
    const [card] = await db.select().from(cards).where(eq(cards.id, cardId));
    if (!card) throw new Error("Card not found");
    if (card.ownerId !== userId) throw new Error("You don't own this card");
    if (card.groupId) throw new Error("This card is already linked to a group");
    if (card.deletedAt) throw new Error("Cannot link a deleted card");
    
    const group = await this.getGroup(groupId);
    if (!group) throw new Error("Group not found");
    if (group.cardType !== "individual") throw new Error("This group uses shared cards");
    
    const [updated] = await db.update(cards)
      .set({ groupId })
      .where(eq(cards.id, cardId))
      .returning();
    return updated;
  }

  async getUserNotifications(userId: string): Promise<Notification[]> {
    return await db.select().from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(20);
  }

  async markNotificationRead(id: string): Promise<void> {
    await db.update(notifications).set({ read: true }).where(eq(notifications.id, id));
  }
}

export const storage = new DatabaseStorage();
