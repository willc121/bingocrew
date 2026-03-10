import { useState, useEffect } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useLocalCards, type LocalCard } from "@/hooks/use-local-cards";
import { useCreatePersonalCard } from "@/hooks/use-my-cards";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Share2, Download, Edit, Cloud, Trash2 } from "lucide-react";
import { PersonalBingoCard } from "@/components/PersonalBingoCard";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toPng, toJpeg } from "html-to-image";
import confetti from "canvas-confetti";
import { WINNING_LINES } from "@shared/schema";
import { getTheme } from "@shared/themes";

export default function LocalCardDetailPage() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { getCard, toggleSquare, deleteCard, clearAllLocalCards } = useLocalCards();
  const createServerCard = useCreatePersonalCard();
  const { toast } = useToast();
  
  const [card, setCard] = useState<LocalCard | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const foundCard = getCard(params.id);
    setCard(foundCard || null);
    setIsLoaded(true);
  }, [params.id, getCard]);

  const handleToggle = (index: number, completed: boolean) => {
    if (!card) return;
    toggleSquare(card.id, index, completed);
    
    const updatedCard = getCard(card.id);
    if (updatedCard) {
      setCard(updatedCard);
      
      if (completed) {
        const prevSet = new Set(card.completedIndices || []);
        const newSet = new Set(updatedCard.completedIndices || []);
        const prevBingos = WINNING_LINES.filter(line => line.every(i => prevSet.has(i))).length;
        const newBingos = WINNING_LINES.filter(line => line.every(i => newSet.has(i))).length;
        
        if (newBingos > prevBingos) {
          confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
          toast({ title: "BINGO!", description: "You completed a line!" });
        }
      }
    }
  };

  const handleSaveToAccount = async () => {
    if (!card || !user) return;
    
    setIsSaving(true);
    try {
      const serverCard = await createServerCard.mutateAsync({
        title: card.title,
        theme: card.theme,
        items: card.items,
      });
      
      deleteCard(card.id);
      
      toast({ title: "Card saved!", description: "Your card is now saved to your account." });
      navigate(`/my-cards/${serverCard.id}`);
    } catch {
      toast({ title: "Error", description: "Failed to save card to account.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!card) return;
    deleteCard(card.id);
    toast({ title: "Card deleted", description: `"${card.title}" has been removed.` });
    navigate("/my-cards");
  };

  const handleShare = async () => {
    if (!card) return;
    const shareData = {
      title: card.title,
      text: `Check out my Resolution Bingo card: ${card.title}`,
      url: window.location.href,
    };
    
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link copied!", description: "Share it with friends." });
    }
  };

  const handleExport = async (format: "png" | "jpeg") => {
    const element = document.getElementById("bingo-card-export");
    if (!element) return;
    
    try {
      const dataUrl = format === "png" 
        ? await toPng(element, { quality: 1 })
        : await toJpeg(element, { quality: 0.95 });
      
      const link = document.createElement("a");
      link.download = `${card?.title || "bingo-card"}.${format}`;
      link.href = dataUrl;
      link.click();
      
      toast({ title: "Downloaded!", description: `Card saved as ${format.toUpperCase()}` });
    } catch {
      toast({ title: "Error", description: "Failed to export card.", variant: "destructive" });
    }
  };

  if (!isLoaded) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Skeleton className="h-[600px] rounded-2xl" />
      </div>
    );
  }

  if (!card) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl text-center">
        <h1 className="text-2xl font-bold mb-4">Card not found</h1>
        <p className="text-muted-foreground mb-6">This card may have been deleted or doesn't exist.</p>
        <Link href="/my-cards">
          <Button>Back to My Cards</Button>
        </Link>
      </div>
    );
  }

  const themeConfig = getTheme(card.theme);
  const bingoCount = WINNING_LINES.filter(line => 
    line.every(i => card.completedIndices?.includes(i))
  ).length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Link href="/my-cards">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{card.title}</h1>
            <p className="text-muted-foreground">Local card (saved on this device)</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {user && (
            <Button 
              onClick={handleSaveToAccount} 
              disabled={isSaving}
              data-testid="button-save-to-account"
            >
              <Cloud className="mr-2 h-4 w-4" />
              {isSaving ? "Saving..." : "Save to Account"}
            </Button>
          )}
          {!user && (
            <a href="/api/login">
              <Button data-testid="button-sign-in-to-save">
                <Cloud className="mr-2 h-4 w-4" />
                Sign In to Save
              </Button>
            </a>
          )}
          <Button variant="outline" onClick={handleShare} data-testid="button-share">
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
          <Button variant="outline" onClick={() => handleExport("png")} data-testid="button-download">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" data-testid="button-delete">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this card?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete "{card.title}". This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {bingoCount > 0 && (
        <div className="mb-6 p-4 bg-primary/10 border border-primary/30 rounded-lg text-center">
          <span className="text-lg font-bold text-primary">
            {bingoCount} BINGO{bingoCount > 1 ? 's' : ''} Complete!
          </span>
        </div>
      )}

      <div id="bingo-card-export">
        <PersonalBingoCard
          cardId={card.id}
          items={card.items}
          completedIndices={card.completedIndices || []}
          onToggle={handleToggle}
          theme={card.theme}
        />
      </div>
    </div>
  );
}
