import { Router } from "express";
import { supabaseAdmin } from "../supabaseAdmin";

const router = Router();

type AuthedReq = {
  headers: any;
  body: any;
  user?: { id: string };
};

async function requireAuth(req: AuthedReq, res: any, next: any) {
  const header = req.headers.authorization || "";
  const match = header.match(/^Bearer (.+)$/);

  if (!match) return res.status(401).json({ error: "Missing Authorization: Bearer <token>" });

  const token = match[1];
  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data?.user) return res.status(401).json({ error: "Invalid or expired token" });

  req.user = { id: data.user.id };
  next();
}

router.get("/", requireAuth, async (req: AuthedReq, res) => {
  const userId = req.user!.id;

  const { data, error } = await supabaseAdmin
    .from("cards")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ cards: data });
});

router.post("/", requireAuth, async (req: AuthedReq, res) => {
  const userId = req.user!.id;
  const { title, year, group_id } = req.body ?? {};

  if (!title || !year) {
    return res.status(400).json({ error: "Missing required fields: title, year" });
  }

  const { data: card, error: cardErr } = await supabaseAdmin
    .from("cards")
    .insert({
      user_id: userId,
      title,
      year,
      group_id: group_id ?? null,
    })
    .select("id")
    .single();

  if (cardErr) return res.status(500).json({ error: cardErr.message });

  const squares = Array.from({ length: 25 }).map((_, position) => ({
    card_id: card.id,
    position,
    text: "",
    is_free: position === 12,
  }));

  const { error: sqErr } = await supabaseAdmin.from("card_squares").insert(squares);

  if (sqErr) {
    await supabaseAdmin.from("cards").delete().eq("id", card.id);
    return res.status(500).json({ error: sqErr.message });
  }

  return res.status(201).json({ card_id: card.id });
});

export default router;
