import { useState, useEffect, useCallback } from "react";
import type { CreatePersonalCardRequest } from "@shared/schema";

export type LocalCard = {
  id: string;
  title: string;
  theme: string;
  items: { id: string; text: string; category?: string }[];
  completedIndices: number[];
  createdAt: string;
};

const STORAGE_KEY = "resolution_bingo_local_cards";

function generateId() {
  return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getLocalCards(): LocalCard[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveLocalCards(cards: LocalCard[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
  } catch (e) {
    console.error("Failed to save local cards:", e);
  }
}

export function useLocalCards() {
  const [cards, setCards] = useState<LocalCard[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setCards(getLocalCards());
    setIsLoaded(true);
  }, []);

  const createCard = useCallback((data: CreatePersonalCardRequest): LocalCard => {
    const newCard: LocalCard = {
      id: generateId(),
      title: data.title,
      theme: data.theme || "default",
      items: data.items,
      completedIndices: [12], // Center is always free
      createdAt: new Date().toISOString(),
    };
    const updated = [...getLocalCards(), newCard];
    saveLocalCards(updated);
    setCards(updated);
    return newCard;
  }, []);

  const updateCard = useCallback((cardId: string, data: Partial<CreatePersonalCardRequest>): LocalCard | null => {
    const currentCards = getLocalCards();
    const index = currentCards.findIndex(c => c.id === cardId);
    if (index === -1) return null;
    
    const updated = { ...currentCards[index] };
    if (data.title) updated.title = data.title;
    if (data.theme) updated.theme = data.theme;
    if (data.items) updated.items = data.items;
    
    currentCards[index] = updated;
    saveLocalCards(currentCards);
    setCards(currentCards);
    return updated;
  }, []);

  const deleteCard = useCallback((cardId: string) => {
    const updated = getLocalCards().filter(c => c.id !== cardId);
    saveLocalCards(updated);
    setCards(updated);
  }, []);

  const toggleSquare = useCallback((cardId: string, squareIndex: number, completed: boolean) => {
    const currentCards = getLocalCards();
    const index = currentCards.findIndex(c => c.id === cardId);
    if (index === -1) return;
    
    const card = currentCards[index];
    let indices = [...(card.completedIndices || [])];
    
    // Center (12) is always free
    if (!indices.includes(12)) indices.push(12);
    
    if (completed && !indices.includes(squareIndex)) {
      indices.push(squareIndex);
    } else if (!completed && indices.includes(squareIndex) && squareIndex !== 12) {
      indices = indices.filter(i => i !== squareIndex);
    }
    
    currentCards[index] = { ...card, completedIndices: indices };
    saveLocalCards(currentCards);
    setCards(currentCards);
  }, []);

  const getCard = useCallback((cardId: string): LocalCard | undefined => {
    return getLocalCards().find(c => c.id === cardId);
  }, []);

  const clearAllLocalCards = useCallback(() => {
    saveLocalCards([]);
    setCards([]);
  }, []);

  return {
    cards,
    isLoaded,
    createCard,
    updateCard,
    deleteCard,
    toggleSquare,
    getCard,
    clearAllLocalCards,
  };
}
