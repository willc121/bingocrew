import { pgTable, text, serial, integer, boolean, timestamp, jsonb, uuid, varchar, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Import Replit Auth models
export * from "./models/auth";
import { users } from "./models/auth";

// === TABLE DEFINITIONS ===

export const groups = pgTable("groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  emoji: text("emoji").default("🎯"),
  theme: text("theme").default("default"),
  ownerId: varchar("owner_id").notNull().references(() => users.id),
  cardLocked: boolean("card_locked").default(false),
  cardType: text("card_type", { enum: ["shared", "individual"] }).default("shared").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const groupMembers = pgTable("group_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id").notNull().references(() => groups.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  role: text("role", { enum: ["owner", "admin", "member"] }).default("member").notNull(),
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const groupInvites = pgTable("group_invites", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id").notNull().references(() => groups.id),
  code: text("code").notNull().unique(),
  expiresAt: timestamp("expires_at"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Cards can now be personal (ownerId set, groupId null) or group-based (groupId set)
export const cards = pgTable("cards", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id").references(() => groups.id), // Nullable for personal cards
  ownerId: varchar("owner_id").references(() => users.id), // For personal cards
  title: text("title").notNull(),
  theme: text("theme").default("default"), // Theme per card for personal cards
  // 25 items. Center is free space.
  items: jsonb("items").$type<{id: string, text: string, category?: string}[]>().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  deletedAt: timestamp("deleted_at"), // Soft delete timestamp
});

// Progress tracks card completion - now keyed by cardId
export const progress = pgTable("progress", {
  id: uuid("id").primaryKey().defaultRandom(),
  cardId: uuid("card_id").notNull().references(() => cards.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  groupId: uuid("group_id").references(() => groups.id), // Optional, for filtering group progress
  // Array of completed square indices
  completedIndices: integer("completed_indices").array().default([]),
  // Map of index -> timestamp string (to track when each was completed)
  completedAt: jsonb("completed_at").$type<Record<number, string>>().default({}),
  bingoCount: integer("bingo_count").default(0),
  lastUpdated: timestamp("last_updated").defaultNow(),
}, (t) => ({
  uniqueUserCardProgress: unique().on(t.cardId, t.userId)
}));

export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id").references(() => groups.id), // Nullable for personal events
  cardId: uuid("card_id").references(() => cards.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: text("type", { enum: ["completed_square", "bingo", "joined_group"] }).notNull(),
  payload: jsonb("payload").$type<{ squareIndex?: number, squareText?: string, line?: string }>().default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => users.id), // Recipient
  groupId: uuid("group_id").references(() => groups.id), // Nullable
  eventId: uuid("event_id").notNull().references(() => events.id),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// === RELATIONS ===
export const groupsRelations = relations(groups, ({ one, many }) => ({
  owner: one(users, { fields: [groups.ownerId], references: [users.id] }),
  members: many(groupMembers),
  card: one(cards, { fields: [groups.id], references: [cards.groupId] }),
  events: many(events),
}));

export const groupMembersRelations = relations(groupMembers, ({ one }) => ({
  group: one(groups, { fields: [groupMembers.groupId], references: [groups.id] }),
  user: one(users, { fields: [groupMembers.userId], references: [users.id] }),
}));

export const cardsRelations = relations(cards, ({ one, many }) => ({
  owner: one(users, { fields: [cards.ownerId], references: [users.id] }),
  group: one(groups, { fields: [cards.groupId], references: [groups.id] }),
  progress: many(progress),
}));

export const eventsRelations = relations(events, ({ one }) => ({
  user: one(users, { fields: [events.userId], references: [users.id] }),
  group: one(groups, { fields: [events.groupId], references: [groups.id] }),
  card: one(cards, { fields: [events.cardId], references: [cards.id] }),
}));

// === INSERTS ===
export const insertGroupSchema = createInsertSchema(groups).omit({ id: true, ownerId: true, createdAt: true, deletedAt: true });
export const insertCardSchema = createInsertSchema(cards).omit({ id: true, createdAt: true, updatedAt: true });
export const insertInviteSchema = createInsertSchema(groupInvites).omit({ id: true, createdBy: true, createdAt: true });

// Personal card schema
export const insertPersonalCardSchema = z.object({
  title: z.string().min(1),
  theme: z.string().optional(),
  items: z.array(z.object({ 
    id: z.string(), 
    text: z.string(), 
    category: z.string().optional() 
  })).length(25),
  completedIndices: z.array(z.number()).optional(),
});

// === EXPLICIT TYPES ===
export type Group = typeof groups.$inferSelect;
export type GroupMember = typeof groupMembers.$inferSelect & { user?: typeof users.$inferSelect };
export type Card = typeof cards.$inferSelect;
export type Progress = typeof progress.$inferSelect;
export type Event = typeof events.$inferSelect;
export type Notification = typeof notifications.$inferSelect;

export type CreateGroupRequest = z.infer<typeof insertGroupSchema>;
export type CreatePersonalCardRequest = z.infer<typeof insertPersonalCardSchema>;
export type UpdateCardRequest = { title: string, items: {id: string, text: string, category?: string}[], theme?: string };
export type ToggleSquareRequest = { squareIndex: number, completed: boolean };
export type JoinGroupRequest = { code: string };

export type BingoItem = { id: string, text: string, category?: string };

// Helper to check for bingos
export const WINNING_LINES = [
  // Rows
  [0, 1, 2, 3, 4], [5, 6, 7, 8, 9], [10, 11, 12, 13, 14], [15, 16, 17, 18, 19], [20, 21, 22, 23, 24],
  // Cols
  [0, 5, 10, 15, 20], [1, 6, 11, 16, 21], [2, 7, 12, 17, 22], [3, 8, 13, 18, 23], [4, 9, 14, 19, 24],
  // Diagonals
  [0, 6, 12, 18, 24], [4, 8, 12, 16, 20]
];
