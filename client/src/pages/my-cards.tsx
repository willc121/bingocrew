import { useAuth } from "@/hooks/use-auth";
import { useMyCards, useDeletePersonalCard, useMigrateLocalCard } from "@/hooks/use-my-cards";
import { useLocalCards, type LocalCard } from "@/hooks/use-local-cards";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Plus, LayoutGrid, Trash2, ArrowRight, CheckCircle, Archive, Cloud, Smartphone, LogIn, Upload } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { WINNING_LINES } from "@shared/schema";
import { getTheme } from "@shared/themes";
import { cn } from "@/lib/utils";

export default function MyCardsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: serverCards, isLoading: serverLoading } = useMyCards();
  const deleteServerCard = useDeletePersonalCard();
  const migrateCard = useMigrateLocalCard();
  const { cards: localCards, isLoaded: localLoaded, deleteCard: deleteLocalCard, getCard: getLocalCard } = useLocalCards();
  const { toast } = useToast();

  const handleDeleteServer = async (cardId: string, cardTitle: string) => {
    try {
      await deleteServerCard.mutateAsync(cardId);
      toast({ title: "Card deleted", description: `"${cardTitle}" has been moved to trash.` });
    } catch {
      toast({ title: "Error", description: "Failed to delete card.", variant: "destructive" });
    }
  };

  const handleDeleteLocal = (cardId: string, cardTitle: string) => {
    deleteLocalCard(cardId);
    toast({ title: "Card deleted", description: `"${cardTitle}" has been removed.` });
  };

  const handleSaveToAccount = async (localCardId: string) => {
    const localCard = getLocalCard(localCardId);
    if (!localCard) return;
    
    try {
      await migrateCard.mutateAsync({
        title: localCard.title,
        theme: localCard.theme,
        items: localCard.items,
        completedIndices: localCard.completedIndices,
      });
      deleteLocalCard(localCardId);
      toast({ title: "Saved to account!", description: `"${localCard.title}" is now synced to your account.` });
    } catch {
      toast({ title: "Error", description: "Failed to save card to account.", variant: "destructive" });
    }
  };

  const handleSaveAllToAccount = async () => {
    let successCount = 0;
    for (const card of localCards) {
      try {
        await migrateCard.mutateAsync({
          title: card.title,
          theme: card.theme,
          items: card.items,
          completedIndices: card.completedIndices,
        });
        deleteLocalCard(card.id);
        successCount++;
      } catch {
        toast({ title: "Error", description: `Failed to save "${card.title}".`, variant: "destructive" });
      }
    }
    if (successCount > 0) {
      toast({ 
        title: "Cards saved!", 
        description: `${successCount} card${successCount > 1 ? 's' : ''} saved to your account.` 
      });
    }
  };

  const getCompletedCount = (indices: number[] | null | undefined) => {
    return indices?.length || 0;
  };

  const getBingoCount = (indices: number[] | null | undefined) => {
    if (!indices) return 0;
    const set = new Set(indices);
    return WINNING_LINES.filter(line => line.every(i => set.has(i))).length;
  };

  const isLoading = authLoading || (!user && !localLoaded) || (user && serverLoading);
  const hasServerCards = user && serverCards && serverCards.length > 0;
  const hasLocalCards = localCards && localCards.length > 0;
  const hasAnyCards = hasServerCards || hasLocalCards;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Bingo Cards</h1>
          <p className="text-muted-foreground mt-1">
            {user ? "Personal cards just for you. Track your own habits and goals." : "Create bingo cards for free. Sign in to save them to your account."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {user && (
            <Link href="/trash">
              <Button variant="outline" data-testid="button-view-trash">
                <Archive className="mr-2 h-4 w-4" /> Trash
              </Button>
            </Link>
          )}
          {!user && (
            <a href="/api/login">
              <Button variant="outline" data-testid="button-sign-in">
                <LogIn className="mr-2 h-4 w-4" /> Sign In
              </Button>
            </a>
          )}
          <Link href="/my-cards/create">
            <Button className="rounded-full shadow-lg shadow-primary/20" data-testid="button-create-card">
              <Plus className="mr-2 h-4 w-4" /> Create Card
            </Button>
          </Link>
        </div>
      </div>

      {!user && hasLocalCards && (
        <div className="mb-6 p-4 bg-muted/50 rounded-lg flex items-center gap-3">
          <Smartphone className="h-5 w-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground flex-1">
            Your cards are saved on this device only. 
            <a href="/api/login" className="text-primary ml-1 hover:underline">Sign in</a> to save them to your account and access them anywhere.
          </p>
        </div>
      )}

      {user && hasLocalCards && (
        <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-3 flex-1">
              <Upload className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="font-medium text-foreground">You have {localCards.length} card{localCards.length > 1 ? 's' : ''} saved on this device</p>
                <p className="text-sm text-muted-foreground">Save them to your account to access from anywhere and unlock all features.</p>
              </div>
            </div>
            <Button 
              onClick={handleSaveAllToAccount}
              disabled={migrateCard.isPending}
              className="shrink-0"
              data-testid="button-save-all-to-account"
            >
              <Cloud className="mr-2 h-4 w-4" />
              {migrateCard.isPending ? 'Saving...' : `Save ${localCards.length === 1 ? 'Card' : 'All Cards'} to Account`}
            </Button>
          </div>
        </div>
      )}

      {hasAnyCards ? (
        <div className="space-y-8">
          {user && hasServerCards && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Cloud className="w-4 h-4 text-muted-foreground" />
                <h2 className="text-lg font-medium">Saved to Account</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {serverCards!.map((card) => {
                  const completed = getCompletedCount(card.progress?.completedIndices);
                  const bingos = getBingoCount(card.progress?.completedIndices);
                  
                  return (
                    <CardItem 
                      key={card.id}
                      id={card.id}
                      title={card.title}
                      createdAt={card.createdAt instanceof Date ? card.createdAt.toISOString() : String(card.createdAt)}
                      completedIndices={card.progress?.completedIndices || []}
                      completed={completed}
                      bingos={bingos}
                      onDelete={() => handleDeleteServer(card.id, card.title)}
                      isLocal={false}
                      theme={card.theme || "default"}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {hasLocalCards && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Smartphone className="w-4 h-4 text-muted-foreground" />
                <h2 className="text-lg font-medium">On This Device</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {localCards.map((card) => {
                  const completed = getCompletedCount(card.completedIndices);
                  const bingos = getBingoCount(card.completedIndices);
                  
                  return (
                    <CardItem 
                      key={card.id}
                      id={card.id}
                      title={card.title}
                      createdAt={card.createdAt}
                      completedIndices={card.completedIndices}
                      completed={completed}
                      bingos={bingos}
                      onDelete={() => handleDeleteLocal(card.id, card.title)}
                      isLocal={true}
                      theme={card.theme || "default"}
                      onSaveToAccount={user ? () => handleSaveToAccount(card.id) : undefined}
                      isMigrating={migrateCard.isPending}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <EmptyState isLoggedIn={!!user} />
      )}
    </div>
  );
}

function CardItem({ 
  id, 
  title, 
  createdAt, 
  completedIndices, 
  completed, 
  bingos, 
  onDelete,
  isLocal,
  theme,
  onSaveToAccount,
  isMigrating
}: { 
  id: string; 
  title: string; 
  createdAt: string; 
  completedIndices: number[]; 
  completed: number; 
  bingos: number;
  onDelete: () => void;
  isLocal: boolean;
  theme: string;
  onSaveToAccount?: () => void;
  isMigrating?: boolean;
}) {
  const themeConfig = getTheme(theme);

  return (
    <Card className={cn(
      "h-full flex flex-col group relative overflow-visible hover:shadow-xl transition-all duration-300",
      themeConfig.card.background,
      themeConfig.card.border
    )} data-testid={`card-bingo-${id}`}>
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
        <LayoutGrid className="w-24 h-24 rotate-12" />
      </div>
      <CardHeader className="relative z-10">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className={cn("text-xl transition-colors", themeConfig.square.text)}>
            {title}
          </CardTitle>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 relative z-20" data-testid={`button-delete-${id}`}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this card?</AlertDialogTitle>
                <AlertDialogDescription>
                  {isLocal 
                    ? `This will permanently delete "${title}". This action cannot be undone.`
                    : `This will move "${title}" to trash. You can restore it later.`
                  }
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        <CardDescription>
          Created {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
          {isLocal && <Badge variant="outline" className="ml-2">Local</Badge>}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="secondary" className={cn("gap-1", themeConfig.completed.background, themeConfig.completed.text)}>
            <CheckCircle className="w-3 h-3" />
            {completed}/25
          </Badge>
          {bingos > 0 && (
            <Badge className={cn("gap-1", themeConfig.freeSpace.gradient, themeConfig.freeSpace.text)}>
              {bingos} BINGO{bingos > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        
        <div className="grid grid-cols-5 gap-0.5 aspect-square max-w-32">
          {Array.from({ length: 25 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "rounded-sm",
                i === 12 
                  ? themeConfig.freeSpace.gradient
                  : completedIndices?.includes(i) 
                    ? themeConfig.completed.background
                    : themeConfig.square.background
              )}
            />
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        {isLocal && onSaveToAccount && (
          <Button 
            variant="default" 
            className="w-full" 
            onClick={onSaveToAccount}
            disabled={isMigrating}
            data-testid={`button-save-to-account-${id}`}
          >
            <Upload className="mr-2 w-4 h-4" />
            {isMigrating ? 'Saving...' : 'Save to Account'}
          </Button>
        )}
        <Link href={isLocal ? `/local-cards/${id}` : `/my-cards/${id}`} className="w-full">
          <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors" data-testid={`button-open-${id}`}>
            Open Card <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

function EmptyState({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <div className="text-center py-20 border-2 border-dashed rounded-3xl bg-muted/20">
      <div className="mx-auto bg-background p-4 rounded-full w-fit mb-4 shadow-sm">
        <LayoutGrid className="w-10 h-10 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold mb-2">No bingo cards yet</h3>
      <p className="text-muted-foreground max-w-sm mx-auto mb-8">
        {isLoggedIn 
          ? "Create your own bingo card to track personal goals and habits."
          : "Create a bingo card to track your goals. No sign up required!"
        }
      </p>
      <Link href="/my-cards/create">
        <Button data-testid="button-create-first-card">Create Your First Card</Button>
      </Link>
    </div>
  );
}
