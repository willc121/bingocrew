import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { api, buildUrl } from "@shared/routes";
import type { Card, Progress, CreatePersonalCardRequest } from "@shared/schema";

export type CardWithProgress = Card & { progress?: Progress };

export function useMyCards() {
  return useQuery<CardWithProgress[]>({
    queryKey: [api.myCards.list.path],
  });
}

export function useMyCard(cardId: string) {
  return useQuery<CardWithProgress>({
    queryKey: [api.myCards.get.path, cardId],
    queryFn: async () => {
      const res = await fetch(buildUrl(api.myCards.get.path, { id: cardId }), { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch card');
      return res.json();
    },
    enabled: !!cardId,
  });
}

export function useCreatePersonalCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreatePersonalCardRequest) => {
      const res = await apiRequest(api.myCards.create.method, api.myCards.create.path, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.myCards.list.path] });
    },
  });
}

export function useUpdatePersonalCard(cardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<CreatePersonalCardRequest>) => {
      const res = await apiRequest(api.myCards.update.method, buildUrl(api.myCards.update.path, { id: cardId }), data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.myCards.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.myCards.get.path, cardId] });
    },
  });
}

export function useDeletePersonalCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (cardId: string) => {
      await apiRequest(api.myCards.delete.method, buildUrl(api.myCards.delete.path, { id: cardId }));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.myCards.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.myCards.trash.path] });
    },
  });
}

export function useTrashedCards() {
  return useQuery<Card[]>({
    queryKey: [api.myCards.trash.path],
  });
}

export function useRestorePersonalCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (cardId: string) => {
      const res = await apiRequest(api.myCards.restore.method, buildUrl(api.myCards.restore.path, { id: cardId }));
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.myCards.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.myCards.trash.path] });
    },
  });
}

export function usePermanentlyDeleteCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (cardId: string) => {
      await apiRequest(api.myCards.permanentDelete.method, buildUrl(api.myCards.permanentDelete.path, { id: cardId }));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.myCards.trash.path] });
    },
  });
}

export function useTogglePersonalProgress(cardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ squareIndex, completed }: { squareIndex: number; completed: boolean }) => {
      const res = await apiRequest(
        api.myCards.toggle.method, 
        buildUrl(api.myCards.toggle.path, { id: cardId }), 
        { squareIndex, completed }
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.myCards.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.myCards.get.path, cardId] });
    },
  });
}

export function useMigrateLocalCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreatePersonalCardRequest & { completedIndices?: number[] }) => {
      const res = await apiRequest(api.myCards.create.method, api.myCards.create.path, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.myCards.list.path] });
    },
  });
}
