import { useParams, Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useGroup, useCreateInvite, useLeaveGroup, useUpdateGroup, useDeleteGroup, useLinkCardToGroup } from "@/hooks/use-groups";
import { useAuth } from "@/hooks/use-auth";
import { useMyCards } from "@/hooks/use-my-cards";
import { BingoCard } from "@/components/BingoCard";
import { PersonalBingoCard } from "@/components/PersonalBingoCard";
import { useTogglePersonalProgress } from "@/hooks/use-my-cards";
import { api } from "@shared/routes";
import { ActivityFeed } from "@/components/ActivityFeed";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Share2, Settings, Crown, LogOut, Copy, Trash2, Users, User, Pencil } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useUpdateCard } from "@/hooks/use-game";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

const EMOJI_OPTIONS = [
  "🎯", "💪", "📚", "🧘‍♀️", "🍳", "🏃‍♂️", "🎨", "🌱", "💼", "🎮", "🎸", "✈️",
  "🏆", "⭐", "🔥", "💎", "🚀", "🎉", "💡", "🎵", "📷", "🏠", "❤️", "🌈",
  "🍀", "🌸", "🎁", "🧠", "💰", "🎓", "🌍", "🏅", "🎪", "🌟", "🦋", "🐝",
  "🐕", "🐈", "🦊", "🦁", "🐼", "🐸", "🦄", "🐙", "🦀", "🐳", "🦅", "🦉",
  "⚽", "🏀", "🎾", "🏈", "⚾", "🎳", "🏋️", "🚴", "🏊", "🧗", "🎿", "🏄",
  "🍕", "🍔", "🍜", "🍣", "🥗", "🍰", "🍪", "🥐", "🍦", "🧁", "☕", "🍷",
  "🌺", "🌻", "🌴", "🌵", "🍂", "❄️", "🌙", "☀️", "🌊", "⛰️", "🏝️", "🌋",
  "🎭", "🎬", "🎤", "🎧", "🎹", "🥁", "🎺", "🎻", "🎲", "🧩", "🎰", "🎨",
  "💻", "📱", "⌚", "📺", "🔬", "🔭", "💊", "🩺", "🧪", "🔧", "🔨", "⚙️"
];

export default function GroupDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { data, isLoading, error } = useGroup(id!);
  const { user } = useAuth();
  const { data: myCards } = useMyCards();
  const { mutate: createInvite, data: inviteData } = useCreateInvite();
  const { mutate: leaveGroup, isPending: isLeaving } = useLeaveGroup();
  const { mutate: updateGroup, isPending: isUpdating } = useUpdateGroup();
  const { mutate: deleteGroup, isPending: isDeleting } = useDeleteGroup();
  const { mutate: linkCard, isPending: isLinking } = useLinkCardToGroup();
  
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmoji, setEditEmoji] = useState("");
  const [editCardType, setEditCardType] = useState<"shared" | "individual">("shared");

  if (isLoading) return <GroupSkeleton />;
  if (error || !data) return <div className="p-8 text-center">Group not found</div>;

  const group = data;
  const members = data.members || [];
  const card = data.activeCard;
  const userProgress = data.myProgress;
  const allProgress = data.allProgress || [];
  const linkedCards = data.linkedCards || [];
  const isOwner = group.ownerId === user?.id;
  
  const completedIndices = userProgress?.completedIndices || [];
  
  // Build leaderboard with bingo counts sorted descending
  // For shared card mode: use allProgress (same card, multiple users)
  // For individual mode: use linkedCards (each member has their own card)
  const isIndividualMode = group.cardType === "individual";
  
  const leaderboardData = members.map(member => {
    let bingoCount = 0;
    let completedCount = 0;
    
    if (isIndividualMode) {
      const memberCard = linkedCards.find((c: any) => c.ownerId === member.userId);
      bingoCount = memberCard?.progress?.bingoCount || 0;
      completedCount = memberCard?.progress?.completedIndices?.length || 0;
    } else {
      const memberProgress = allProgress.find((p: any) => p.userId === member.userId);
      bingoCount = memberProgress?.bingoCount || 0;
      completedCount = memberProgress?.completedIndices?.length || 0;
    }
    
    return {
      ...member,
      bingoCount,
      completedCount
    };
  }).sort((a, b) => b.bingoCount - a.bingoCount || b.completedCount - a.completedCount);
  
  // Parse card items properly, ensure array exists
  const cardItems = card?.items || [];
  
  // Check if card is properly configured (has actual text content, not just empty items)
  const hasValidCard = cardItems.length > 0 && cardItems.some((item: any) => item?.text && item.text.trim() !== '');

  const handleCreateInvite = () => {
    createInvite(group.id);
    setShowInviteDialog(true);
  };

  const handleOpenSettings = () => {
    setEditName(group.name);
    setEditEmoji(group.emoji || "");
    setEditCardType(group.cardType || "shared");
    setShowSettingsDialog(true);
  };

  const handleSaveSettings = () => {
    updateGroup({ 
      groupId: group.id, 
      data: { name: editName, emoji: editEmoji, cardType: editCardType } 
    }, {
      onSuccess: () => setShowSettingsDialog(false)
    });
  };

  const handleLeaveGroup = () => {
    leaveGroup(group.id, {
      onSuccess: () => navigate("/")
    });
  };
  
  const handleDeleteGroup = () => {
    deleteGroup(group.id, {
      onSuccess: () => navigate("/")
    });
  };
  
  const handleLinkCard = (cardId: string) => {
    linkCard({ groupId: group.id, cardId });
  };
  
  const availableCardsToLink = myCards?.filter(c => !c.groupId) || [];

  return (
    <div className="container mx-auto px-4 py-8 pb-20 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
           <div className="flex items-center gap-2 mb-1">
             <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
               &larr; Dashboard
             </Link>
           </div>
           <div className="flex items-center gap-3">
             <span className="text-4xl">{group.emoji}</span>
             <h1 className="text-3xl font-display font-bold">{group.name}</h1>
             {isOwner && <Badge variant="secondary" className="gap-1"><Crown className="w-3 h-3" /> Owner</Badge>}
           </div>
           <p className="text-muted-foreground mt-1 ml-14">
             {members.length} members • Created {new Date(group.createdAt!).toLocaleDateString()}
           </p>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <Button variant="outline" className="flex-1 md:flex-none" onClick={handleCreateInvite} data-testid="button-invite">
            <Share2 className="w-4 h-4 mr-2" /> Invite
          </Button>
          {isOwner ? (
            <Button variant="ghost" size="icon" onClick={handleOpenSettings} data-testid="button-settings">
              <Settings className="w-5 h-5 text-muted-foreground" />
            </Button>
          ) : (
            <Button variant="ghost" size="icon" onClick={() => setShowLeaveDialog(true)} data-testid="button-leave">
              <LogOut className="w-5 h-5 text-muted-foreground" />
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content: Bingo Card */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="card" className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
              <TabsTrigger value="card">My Card</TabsTrigger>
              <TabsTrigger value="activity">Group Activity</TabsTrigger>
            </TabsList>
            
            <TabsContent value="card" className="mt-6">
              {isIndividualMode ? (
                <IndividualModeContent 
                  groupId={group.id}
                  availableCards={availableCardsToLink}
                  onLinkCard={handleLinkCard}
                  isLinking={isLinking}
                  myLinkedCard={myCards?.find(c => c.groupId === group.id)}
                  otherLinkedCards={linkedCards.filter(c => c.ownerId !== user?.id)}
                  members={members}
                />
              ) : hasValidCard ? (
                <BingoCard 
                  groupId={group.id} 
                  items={cardItems} 
                  completedIndices={completedIndices}
                  locked={group.cardLocked ?? false}
                />
              ) : (
                <SetupCardState isOwner={isOwner} groupId={group.id} />
              )}
            </TabsContent>
            
            <TabsContent value="activity" className="mt-6">
               <Card>
                 <CardHeader>
                   <CardTitle>Recent Activity</CardTitle>
                 </CardHeader>
                 <CardContent>
                   <ActivityFeed events={group.events || []} />
                 </CardContent>
               </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar: Leaderboard & Stats */}
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-500" /> Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {leaderboardData.slice(0, 5).map((member, i) => (
                <div key={member.id} className="flex items-center justify-between" data-testid={`leaderboard-row-${i}`}>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm text-muted-foreground w-4">{i + 1}</span>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">
                        {member.user?.firstName} {member.user?.lastName?.[0]}.
                      </span>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-background" data-testid={`bingo-count-${i}`}>
                     {member.bingoCount} {member.bingoCount === 1 ? 'Bingo' : 'Bingos'}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
             <CardHeader>
               <CardTitle className="text-sm uppercase text-muted-foreground tracking-wider">Your Progress</CardTitle>
             </CardHeader>
             <CardContent>
                <div className="text-3xl font-bold font-display text-primary">
                  {completedIndices.length} / 25
                </div>
                <div className="w-full bg-muted h-2 rounded-full mt-2 overflow-hidden">
                  <div 
                    className="bg-primary h-full rounded-full transition-all duration-1000" 
                    style={{ width: `${(completedIndices.length / 25) * 100}%` }}
                  />
                </div>
             </CardContent>
          </Card>
        </div>
      </div>

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Friends</DialogTitle>
            <DialogDescription>
              Share this message with your friends to invite them to your group.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted rounded-md">
              <p className="text-sm">
                Join my Bingo Crew group with this code: <span className="font-mono font-bold">{inviteData?.code || "..."}</span>
              </p>
            </div>
            <Button 
              className="w-full" 
              onClick={() => {
                const message = `Join my Bingo Crew group with this code: ${inviteData?.code}`;
                navigator.clipboard.writeText(message);
              }}
            >
              <Copy className="w-4 h-4 mr-2" /> Copy Message
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Group Settings</DialogTitle>
            <DialogDescription>
              Update your group's name, icon, and card mode.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="group-name">Group Name</Label>
              <Input 
                id="group-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter group name"
                data-testid="input-group-name"
              />
            </div>
            <div className="space-y-2">
              <Label>Group Icon</Label>
              <ScrollArea className="h-32">
                <div className="grid grid-cols-8 gap-1">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setEditEmoji(emoji)}
                      className={`text-xl p-1.5 rounded-lg transition-all ${
                        editEmoji === emoji 
                          ? "bg-primary/10 ring-2 ring-primary scale-110" 
                          : "hover:bg-muted"
                      }`}
                      data-testid={`emoji-option-${emoji}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>
            <div className="space-y-2">
              <Label>Card Mode</Label>
              <Select value={editCardType} onValueChange={(v: "shared" | "individual") => setEditCardType(v)}>
                <SelectTrigger data-testid="select-card-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="shared">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>Shared Card - Everyone tracks the same card</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="individual">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>Individual Cards - Each member has their own</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {editCardType === "shared" 
                  ? "All members track progress on the same bingo card with a leaderboard."
                  : "Each member uses their own personal card. Members can view each other's cards."}
              </p>
            </div>
            <div className="pt-4 border-t">
              <Button 
                variant="destructive" 
                className="w-full"
                onClick={() => {
                  setShowSettingsDialog(false);
                  setShowDeleteDialog(true);
                }}
                data-testid="button-delete-group"
              >
                <Trash2 className="w-4 h-4 mr-2" /> Delete Group
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettingsDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveSettings} disabled={isUpdating} data-testid="button-save-settings">
              {isUpdating ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Group Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Group?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{group.name}"? This action cannot be undone and all members will lose access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteGroup}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground"
              data-testid="button-confirm-delete"
            >
              {isDeleting ? "Deleting..." : "Delete Group"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Leave Group Confirmation */}
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave Group?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to leave "{group.name}"? You'll need a new invite code to rejoin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleLeaveGroup}
              disabled={isLeaving}
              className="bg-destructive text-destructive-foreground"
              data-testid="button-confirm-leave"
            >
              {isLeaving ? "Leaving..." : "Leave Group"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SetupCardState({ isOwner, groupId }: { isOwner: boolean, groupId: string }) {
  const { mutate: updateCard, isPending } = useUpdateCard(groupId);
  const [items, setItems] = useState(Array(25).fill(""));

  // Quick fill generator
  const fillRandom = () => {
    const habits = [
      "Drink 2L water", "Read 10 pages", "Walk 10k steps", "No sugar day", 
      "Meditate 10m", "Call a friend", "Cook a meal", "Sleep 8h", "Gym workout",
      "Learn new skill", "Clean room", "Save $10", "No social media", "Eat fruit",
      "Journaling", "Stretch", "Yoga", "Listen to podcast", "Compliment someone",
      "Wake up early", "Review goals", "Floss teeth", "Take vitamins", "Try new food",
      "Plant based meal"
    ];
    // Shuffle and pick 25
    const shuffled = habits.sort(() => 0.5 - Math.random()).slice(0, 25);
    setItems(shuffled);
  };

  const handleSave = () => {
    // Format for API
    const formattedItems = items.map((text, i) => ({
      id: `item-${i}`,
      text: text || "Free Space",
      category: "general"
    }));
    updateCard({ title: "Group Card", items: formattedItems });
  };

  if (!isOwner) {
    return (
      <div className="p-12 text-center border-2 border-dashed rounded-3xl bg-muted/20">
        <h3 className="text-xl font-semibold">Waiting for Admin</h3>
        <p className="text-muted-foreground mt-2">The group owner hasn't set up the bingo card yet.</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Setup Bingo Card</CardTitle>
        <p className="text-muted-foreground text-sm">Fill in the 24 items (center is free) to start the game.</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-4 mb-4">
           <Button variant="outline" onClick={fillRandom}>Quick Fill (Random Habits)</Button>
        </div>
        
        <div className="grid grid-cols-5 gap-2">
           {items.map((item, i) => (
             i === 12 ? (
               <div key={i} className="aspect-square flex items-center justify-center bg-muted rounded-md text-xs font-bold text-muted-foreground">
                 FREE SPACE
               </div>
             ) : (
               <Input 
                 key={i} 
                 value={item} 
                 onChange={(e) => {
                   const newItems = [...items];
                   newItems[i] = e.target.value;
                   setItems(newItems);
                 }}
                 className="aspect-square text-[10px] sm:text-xs px-1 text-center h-auto" 
                 placeholder={`Item ${i+1}`}
               />
             )
           ))}
        </div>

        <Button onClick={handleSave} disabled={isPending} className="w-full">
          {isPending ? "Saving..." : "Save & Publish Card"}
        </Button>
      </CardContent>
    </Card>
  );
}

function LinkedCardDisplay({ card, groupId }: { card: any; groupId: string }) {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { mutate: toggleProgress, isPending } = useTogglePersonalProgress(card.id);
  
  const handleToggle = (index: number, completed: boolean) => {
    toggleProgress({ squareIndex: index, completed }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [api.groups.get.path, groupId] });
      }
    });
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="text-lg font-semibold">Your Card: {card.title}</h3>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate(`/my-cards/${card.id}`)}
          data-testid="button-view-card"
        >
          <Pencil className="w-4 h-4 mr-2" /> View & Edit
        </Button>
      </div>
      <PersonalBingoCard 
        cardId={card.id}
        items={card.items || []}
        completedIndices={card.progress?.completedIndices || []}
        onToggle={handleToggle}
        isPending={isPending}
        theme={card.theme}
      />
    </div>
  );
}

function IndividualModeContent({ 
  groupId, 
  availableCards, 
  onLinkCard, 
  isLinking,
  myLinkedCard,
  otherLinkedCards,
  members
}: { 
  groupId: string;
  availableCards: any[];
  onLinkCard: (cardId: string) => void;
  isLinking: boolean;
  myLinkedCard?: any;
  otherLinkedCards: any[];
  members: any[];
}) {
  const [, navigate] = useLocation();
  const [viewingCard, setViewingCard] = useState<any>(null);
  
  const getMemberName = (ownerId: string) => {
    const member = members.find(m => m.userId === ownerId);
    if (member?.user) {
      return `${member.user.firstName} ${member.user.lastName?.[0] || ''}.`;
    }
    return "Unknown";
  };
  
  if (viewingCard) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="text-lg font-semibold">{getMemberName(viewingCard.ownerId)}'s Card: {viewingCard.title}</h3>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setViewingCard(null)}
            data-testid="button-back-to-my-card"
          >
            Back to My Card
          </Button>
        </div>
        <PersonalBingoCard 
          cardId={viewingCard.id}
          items={viewingCard.items || []}
          completedIndices={viewingCard.progress?.completedIndices || []}
          onToggle={() => {}}
          isPending={false}
          theme={viewingCard.theme}
          readOnly={true}
        />
      </div>
    );
  }
  
  if (myLinkedCard) {
    return (
      <div className="space-y-6">
        <LinkedCardDisplay card={myLinkedCard} groupId={groupId} />
        
        {otherLinkedCards.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" /> Group Members' Cards
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              {otherLinkedCards.map((card) => (
                <div 
                  key={card.id} 
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  data-testid={`member-card-${card.id}`}
                >
                  <div>
                    <span className="font-medium">{getMemberName(card.ownerId)}</span>
                    <p className="text-xs text-muted-foreground">
                      {card.title} - {card.progress?.completedIndices?.length || 0}/25 completed
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setViewingCard(card)}
                    data-testid={`button-view-member-card-${card.id}`}
                  >
                    View Card
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Link Your Card</CardTitle>
        <p className="text-muted-foreground text-sm">
          This group uses individual cards. Link one of your existing personal cards or create a new one.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {availableCards.length > 0 ? (
          <div className="space-y-3">
            <Label>Choose an existing card:</Label>
            <div className="grid gap-2">
              {availableCards.map((card) => (
                <div 
                  key={card.id} 
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <span className="font-medium">{card.title}</span>
                    <p className="text-xs text-muted-foreground">
                      {card.progress?.completedIndices?.length || 0}/25 completed
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => onLinkCard(card.id)}
                    disabled={isLinking}
                    data-testid={`button-link-card-${card.id}`}
                  >
                    {isLinking ? "Linking..." : "Use This Card"}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-6 space-y-4">
            <p className="text-muted-foreground">You don't have any personal cards yet.</p>
            <Button onClick={() => navigate("/my-cards/create")} data-testid="button-create-card">
              Create Your First Card
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function GroupSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
       <div className="flex gap-4 items-center">
         <Skeleton className="w-16 h-16 rounded-xl" />
         <div className="space-y-2">
           <Skeleton className="w-48 h-8" />
           <Skeleton className="w-32 h-4" />
         </div>
       </div>
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <Skeleton className="lg:col-span-2 h-[500px] rounded-3xl" />
         <Skeleton className="h-[300px] rounded-3xl" />
       </div>
    </div>
  );
}
