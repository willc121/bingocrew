import { useRef, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useMyCard, useTogglePersonalProgress } from "@/hooks/use-my-cards";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShareExport } from "@/components/ShareExport";
import { PersonalBingoCard } from "@/components/PersonalBingoCard";
import { ArrowLeft, CheckCircle, Trophy, Pencil } from "lucide-react";
import { WINNING_LINES } from "@shared/schema";
import confetti from "canvas-confetti";

export default function MyCardDetailPage() {
  const [, params] = useRoute("/my-cards/:id");
  const cardId = params?.id || "";
  const { user, isLoading: authLoading } = useAuth();
  const { data: card, isLoading, error } = useMyCard(cardId);
  const cardRef = useRef<HTMLDivElement>(null);
  const toggleProgress = useTogglePersonalProgress(cardId);

  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = '/api/login';
    }
  }, [user, authLoading]);

  // Celebrate bingo
  useEffect(() => {
    if (toggleProgress.data?.newBingo) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [toggleProgress.data?.newBingo]);

  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="aspect-square w-full max-w-2xl mx-auto rounded-3xl" />
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Card not found</h1>
        <Link href="/my-cards">
          <Button variant="outline">
            <ArrowLeft className="mr-2 w-4 h-4" /> Back to My Cards
          </Button>
        </Link>
      </div>
    );
  }

  const completedIndices = card.progress?.completedIndices || [];
  const bingoCount = card.progress?.bingoCount || 0;
  
  // Find winning lines for highlighting
  const winningLineIndices = new Set<number>();
  const completedSet = new Set(completedIndices);
  WINNING_LINES.forEach(line => {
    if (line.every(i => completedSet.has(i))) {
      line.forEach(i => winningLineIndices.add(i));
    }
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-4">
          <Link href="/my-cards">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{card.title}</h1>
            <div className="flex gap-2 mt-2">
              <Badge variant="secondary" className="gap-1">
                <CheckCircle className="w-3 h-3" />
                {completedIndices.length}/25 completed
              </Badge>
              {bingoCount > 0 && (
                <Badge className="gap-1 bg-gradient-to-r from-primary to-purple-600">
                  <Trophy className="w-3 h-3" />
                  {bingoCount} BINGO{bingoCount > 1 ? 's' : ''}!
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Link href={`/my-cards/${cardId}/edit`}>
            <Button variant="outline" size="icon" data-testid="button-edit-card">
              <Pencil className="w-4 h-4" />
            </Button>
          </Link>
          <ShareExport 
            cardRef={cardRef} 
            cardTitle={card.title} 
            completedCount={completedIndices.length}
            bingoCount={bingoCount}
          />
        </div>
      </div>

      {/* Bingo Card */}
      <div ref={cardRef}>
        <PersonalBingoCard
          cardId={cardId}
          items={card.items as any}
          completedIndices={completedIndices}
          winningLineIndices={winningLineIndices}
          onToggle={(index, completed) => toggleProgress.mutate({ squareIndex: index, completed })}
          isPending={toggleProgress.isPending}
          theme={card.theme || "default"}
        />
      </div>

      {/* Progress Stats */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg">Your Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted rounded-xl">
              <div className="text-3xl font-bold text-primary">{completedIndices.length}</div>
              <div className="text-sm text-muted-foreground">Squares Done</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-xl">
              <div className="text-3xl font-bold text-primary">{25 - completedIndices.length}</div>
              <div className="text-sm text-muted-foreground">Remaining</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-xl">
              <div className="text-3xl font-bold text-primary">{bingoCount}</div>
              <div className="text-sm text-muted-foreground">Bingos</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-xl">
              <div className="text-3xl font-bold text-primary">{Math.round((completedIndices.length / 25) * 100)}%</div>
              <div className="text-sm text-muted-foreground">Complete</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
