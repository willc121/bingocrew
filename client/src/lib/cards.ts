import { supabase } from "./supabaseClient";
import { createSquares } from "./squares";

export type Card = {
  id: string;
  title: string;
  theme: string | null;
  created_at: string;
};

function withTimeout<T>(p: Promise<T>, ms = 8000) {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms);
    p.then((v) => {
      clearTimeout(t);
      resolve(v);
    }).catch((e) => {
      clearTimeout(t);
      reject(e);
    });
  });
}

export async function createCard(title: string, theme?: string) {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) throw new Error("Not logged in");

  const { data, error } = await supabase
    .from("cards")
    .insert({ owner_id: user.id, title, theme: theme ?? null })
    .select("id, title, theme, created_at")
    .single();

  if (error) throw error;

  try {
    await withTimeout(createSquares(data.id), 8000);
  } catch (e: any) {
    console.error("createSquares failed", e);
    throw new Error(`Card created but squares failed: ${e?.message ?? String(e)}`);
  }

  return data as Card;
}

export async function listMyCards() {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) throw new Error("Not logged in");

  const { data, error } = await supabase
    .from("cards")
    .select("id, title, theme, created_at")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Card[];
}
