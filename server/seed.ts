import { db } from "./db";
import { groups, cards, users, groupMembers } from "@shared/schema";
import { authStorage } from "./replit_integrations/auth";

async function seed() {
  console.log("Seeding database...");

  // Create a test user if not exists (simulated via AuthStorage upsert)
  const user = await authStorage.upsertUser({
    id: "test-user-id",
    email: "test@example.com",
    firstName: "Test",
    lastName: "User",
    profileImageUrl: "https://github.com/shadcn.png"
  });

  // Create a demo group
  const [group] = await db.insert(groups).values({
    name: "2026 Bingo Crew",
    emoji: "🎯",
    theme: "neon",
    ownerId: user.id,
  }).returning();

  // Add member
  await db.insert(groupMembers).values({
    groupId: group.id,
    userId: user.id,
    role: "owner"
  });

  // Create a card
  const items = [
    { id: "1", text: "Drink 2L Water", category: "health" },
    { id: "2", text: "Read 10 pages", category: "learning" },
    { id: "3", text: "Walk 10k steps", category: "health" },
    { id: "4", text: "Call a friend", category: "social" },
    { id: "5", text: "Save $50", category: "finance" },
    { id: "6", text: "Cook a meal", category: "home" },
    { id: "7", text: "Meditate 10m", category: "health" },
    { id: "8", text: "Learn a new word", category: "learning" },
    { id: "9", text: "No sugar day", category: "health" },
    { id: "10", text: "Clean desk", category: "home" },
    { id: "11", text: "Workout 30m", category: "health" },
    { id: "12", text: "Sleep 8h", category: "health" },
    // Center is usually 12 in 0-24 index, but items list has 25 items including free space or logic handles it.
    // Schema says 25 items.
    { id: "13", text: "FREE SPACE", category: "free" },
    { id: "14", text: "Donate $10", category: "community" },
    { id: "15", text: "Visit park", category: "adventure" },
    { id: "16", text: "Try new recipe", category: "home" },
    { id: "17", text: "No social media", category: "wellness" },
    { id: "18", text: "Journal", category: "wellness" },
    { id: "19", text: "Listen to podcast", category: "learning" },
    { id: "20", text: "Stretch", category: "health" },
    { id: "21", text: "Review budget", category: "finance" },
    { id: "22", text: "Compliment someone", category: "social" },
    { id: "23", text: "Water plants", category: "home" },
    { id: "24", text: "Plan week", category: "productivity" },
    { id: "25", text: "Go to bed early", category: "health" },
  ];

  await db.insert(cards).values({
    groupId: group.id,
    title: "January Kickoff",
    items: items
  });

  console.log("Seeding complete!");
}

seed().catch(console.error).finally(() => process.exit(0));
