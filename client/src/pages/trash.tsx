import { useAuth } from "@/hooks/use-auth";
import { useTrashedCards, useRestorePersonalCard, usePermanentlyDeleteCard } from "@/hooks/use-my-cards";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, RotateCcw, ArrowLeft, AlertTriangle } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { formatDistanceToNow } from "date-fns";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export default function TrashPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: cards, isLoading } = useTrashedCards();
  const restoreCard = useRestorePersonalCard();
  const permanentDelete = usePermanentlyDeleteCard();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = '/api/login';
    }
  }, [user, authLoading]);

  const handleRestore = async (cardId: string, cardTitle: string) => {
    try {
      await restoreCard.mutateAsync(cardId);
      toast({ title: "Card restored", description: `"${cardTitle}" has been restored to My Cards.` });
    } catch {
      toast({ title: "Error", description: "Failed to restore card.", variant: "destructive" });
    }
  };

  const handlePermanentDelete = async (cardId: string, cardTitle: string) => {
    try {
      await permanentDelete.mutateAsync(cardId);
      toast({ title: "Card permanently deleted", description: `"${cardTitle}" has been permanently deleted.` });
    } catch {
      toast({ title: "Error", description: "Failed to delete card.", variant: "destructive" });
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/my-cards">
              <Button variant="ghost" size="icon" data-testid="button-back-to-cards">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">Trash</h1>
          </div>
          <p className="text-muted-foreground mt-1">Deleted cards can be restored or permanently removed.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
        </div>
      ) : cards && cards.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => (
            <Card key={card.id} className="h-full flex flex-col relative overflow-hidden border-destructive/30" data-testid={`card-trash-${card.id}`}>
              <CardHeader>
                <CardTitle className="text-xl text-muted-foreground">
                  {card.title}
                </CardTitle>
                <CardDescription>
                  Deleted {card.deletedAt ? formatDistanceToNow(new Date(card.deletedAt), { addSuffix: true }) : 'recently'}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertTriangle className="w-4 h-4" />
                  <span>This card will be permanently deleted after 30 days</span>
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1" 
                  onClick={() => handleRestore(card.id, card.title)}
                  disabled={restoreCard.isPending}
                  data-testid={`button-restore-${card.id}`}
                >
                  <RotateCcw className="mr-2 w-4 h-4" />
                  Restore
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="icon" data-testid={`button-permanent-delete-${card.id}`}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Permanently delete this card?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete "{card.title}" and all associated data. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => handlePermanentDelete(card.id, card.title)} 
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete Forever
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-20 border-2 border-dashed rounded-3xl bg-muted/20">
      <div className="mx-auto bg-background p-4 rounded-full w-fit mb-4 shadow-sm">
        <Trash2 className="w-10 h-10 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold mb-2">Trash is empty</h3>
      <p className="text-muted-foreground max-w-sm mx-auto mb-8">
        Deleted cards will appear here and can be restored.
      </p>
      <Link href="/my-cards">
        <Button variant="outline">Back to My Cards</Button>
      </Link>
    </div>
  );
}
