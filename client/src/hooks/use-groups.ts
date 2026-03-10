import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { apiRequest } from "@/lib/queryClient";
import type { CreateGroupRequest, Group, GroupMember, JoinGroupRequest } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// === GET GROUPS ===
export function useGroups() {
  return useQuery({
    queryKey: [api.groups.list.path],
    queryFn: async () => {
      const res = await fetch(api.groups.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch groups");
      return await res.json() as (Group & { memberCount: number })[];
    },
  });
}

// === GET SINGLE GROUP ===
export type GroupDetail = Group & {
  members: GroupMember[];
  activeCard: any;
  myProgress: any;
  allProgress: any[];
  linkedCards: any[];
  events: any[];
};

export function useGroup(id: string) {
  return useQuery({
    queryKey: [api.groups.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.groups.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch group details");
      return await res.json() as GroupDetail;
    },
    enabled: !!id,
  });
}

// === CREATE GROUP ===
export function useCreateGroup() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateGroupRequest) => {
      const res = await apiRequest("POST", api.groups.create.path, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.groups.list.path] });
      toast({ title: "Success", description: "Group created successfully!" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

// === JOIN GROUP ===
export function useJoinGroup() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: JoinGroupRequest) => {
      const res = await apiRequest("POST", api.groups.join.path, data);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.groups.list.path] });
      toast({ title: "Welcome!", description: "You've joined the group." });
      return data; // Return data so we can redirect
    },
    onError: (error: Error) => {
      toast({ title: "Cannot Join", description: error.message, variant: "destructive" });
    },
  });
}

// === CREATE INVITE ===
export function useCreateInvite() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (groupId: string) => {
      const url = buildUrl(api.groups.createInvite.path, { id: groupId });
      const res = await apiRequest("POST", url);
      return await res.json() as { code: string; expiresAt: string | null };
    },
    onSuccess: (data) => {
      const message = `Join my Bingo Crew group with this code: ${data.code}`;
      navigator.clipboard.writeText(message);
      toast({ 
        title: "Invite Copied!", 
        description: "Share the message with your friends.",
      });
      return data;
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

// === LEAVE GROUP ===
export function useLeaveGroup() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (groupId: string) => {
      const url = buildUrl(api.groups.leave.path, { id: groupId });
      const res = await apiRequest("POST", url);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to leave group");
      }
      return { ...(await res.json()), groupId };
    },
    onSuccess: (data) => {
      queryClient.removeQueries({ queryKey: [api.groups.get.path, data.groupId] });
      queryClient.invalidateQueries({ queryKey: [api.groups.list.path] });
      toast({ title: "Left Group", description: "You've left the group." });
    },
    onError: (error: Error) => {
      toast({ title: "Cannot Leave", description: error.message, variant: "destructive" });
    },
  });
}

// === UPDATE GROUP ===
export function useUpdateGroup() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ groupId, data }: { groupId: string; data: { name?: string; emoji?: string; cardType?: string } }) => {
      const url = buildUrl(api.groups.update.path, { id: groupId });
      const res = await apiRequest("PUT", url, data);
      return await res.json();
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: [api.groups.get.path, variables.groupId] });
      await queryClient.invalidateQueries({ queryKey: [api.groups.list.path] });
      toast({ title: "Group Updated", description: "Changes saved successfully." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

// === DELETE GROUP ===
export function useDeleteGroup() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (groupId: string) => {
      const url = buildUrl(api.groups.delete.path, { id: groupId });
      const res = await apiRequest("DELETE", url);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to delete group");
      }
      return { groupId };
    },
    onSuccess: (data) => {
      queryClient.removeQueries({ queryKey: [api.groups.get.path, data.groupId] });
      queryClient.invalidateQueries({ queryKey: [api.groups.list.path] });
      toast({ title: "Group Deleted", description: "The group has been deleted." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

// === LINK CARD TO GROUP ===
export function useLinkCardToGroup() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ groupId, cardId }: { groupId: string; cardId: string }) => {
      const url = buildUrl(api.groups.linkCard.path, { id: groupId });
      const res = await apiRequest("POST", url, { cardId });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to link card");
      }
      return await res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.groups.get.path, variables.groupId] });
      queryClient.invalidateQueries({ queryKey: ['/api/my-cards'] });
      toast({ title: "Card Linked", description: "Your card has been linked to this group." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}
