import { supabase } from "./supabaseClient";

export type Square = {
  id: string;
  card_id: string;
  position: number;
  text: string;
};

export const DEFAULT_25 = Array.from({ length: 25 }).map((_, i) => ({
  position: i,
  text: `Square ${i + 1}`,
}));

export async function createSquares(cardId: string, squares = DEFAULT_25) {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) throw new Error("Not logged in");

  // RLS for card_squares checks ownership via parent card, so just insert.
  const payload = squares.map((s) => ({
    card_id: cardId,
    position: s.position,
    text: s.text,
  }));

  const { error } = await supabase.from("card_squares").insert(payload);
  if (error) throw error;
}

export async function listSquares(cardId: string) {
  const { data, error } = await supabase
    .from("card_squares")
    .select("id, card_id, position, text")
    .eq("card_id", cardId)
    .order("position", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Square[];
}
