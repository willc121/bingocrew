import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { apiRequest } from "@/lib/queryClient";
import type { UpdateCardRequest, ToggleSquareRequest } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import confetti from "canvas-confetti";

// === UPDATE CARD (ADMIN) ===
export function useUpdateCard(groupId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: UpdateCardRequest) => {
      const url = buildUrl(api.card.update.path, { id: groupId });
      const res = await apiRequest("PUT", url, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.groups.get.path, groupId] });
      toast({ title: "Card Updated", description: "The group bingo card has been saved." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

// === TOGGLE PROGRESS (USER) ===
export function useToggleProgress(groupId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: ToggleSquareRequest) => {
      const url = buildUrl(api.progress.toggle.path, { id: groupId });
      const res = await apiRequest("POST", url, data);
      return await res.json();
    },
    onSuccess: (data) => {
      // Invalidate group data to reflect progress changes
      queryClient.invalidateQueries({ queryKey: [api.groups.get.path, groupId] });
      
      if (data.newBingo) {
        toast({ 
          title: "BINGO! 🎉", 
          description: "Congratulations! You completed a line!",
          className: "bg-primary text-primary-foreground border-none"
        });
        fireConfetti();
      }
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

function fireConfetti() {
  const count = 200;
  const defaults = {
    origin: { y: 0.7 }
  };

  function fire(particleRatio: number, opts: any) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio)
    });
  }

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
  });
  fire(0.2, {
    spread: 60,
  });
  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 45,
  });
}
