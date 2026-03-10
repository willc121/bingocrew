import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useMyCard, useUpdatePersonalCard } from "@/hooks/use-my-cards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Star } from "lucide-react";
import { Link } from "wouter";
import { THEME_OPTIONS, getTheme } from "@shared/themes";
import { cn } from "@/lib/utils";

export default function EditPersonalCardPage() {
  const [, params] = useRoute("/my-cards/:id/edit");
  const cardId = params?.id || "";
  const { user, isLoading: authLoading } = useAuth();
  const { data: card, isLoading } = useMyCard(cardId);
  const [, navigate] = useLocation();
  const updateCard = useUpdatePersonalCard(cardId);
  const { toast } = useToast();
  
  const [title, setTitle] = useState("");
  const [theme, setTheme] = useState("default");
  const [items, setItems] = useState<{ id: string; text: string; category?: string }[]>([]);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = '/api/login';
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (card && !initialized) {
      setTitle(card.title);
      setTheme(card.theme || "default");
      setItems(card.items as { id: string; text: string; category?: string }[]);
      setInitialized(true);
    }
  }, [card, initialized]);

  const themeConfig = getTheme(theme);

  const updateItem = (index: number, text: string) => {
    if (index === 12) return;
    const trimmedText = text.slice(0, 100);
    const newItems = [...items];
    newItems[index] = { ...newItems[index], text: trimmedText };
    setItems(newItems);
  };

  const filledCount = items.filter((item, i) => i !== 12 && item.text.trim()).length;
  const isComplete = filledCount === 24 && title.trim();

  const handleSave = async () => {
    if (!title.trim()) {
      toast({ title: "Title required", description: "Give your card a name.", variant: "destructive" });
      return;
    }
    if (filledCount < 24) {
      toast({ title: "Fill all squares", description: `You have ${24 - filledCount} empty squares.`, variant: "destructive" });
      return;
    }

    try {
      await updateCard.mutateAsync({ title, theme, items });
      toast({ title: "Card updated!", description: "Changes saved successfully." });
      navigate(`/my-cards/${cardId}`);
    } catch {
      toast({ title: "Error", description: "Failed to update card.", variant: "destructive" });
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="aspect-square w-full max-w-2xl mx-auto rounded-3xl" />
      </div>
    );
  }

  if (!card) {
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/my-cards/${cardId}`}>
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Edit Card</h1>
          <p className="text-muted-foreground">Update your card's theme, title, or goals</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Label htmlFor="title">Card Title</Label>
            <Input 
              id="title"
              placeholder="e.g., Bingo 2026, January Goals"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              data-testid="input-card-title"
            />
          </div>
          <div className="sm:w-48">
            <Label htmlFor="theme">Theme</Label>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger data-testid="select-theme">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background border">
                {THEME_OPTIONS.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: t.previewColor }} 
                      />
                      {t.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className={cn(
          "rounded-3xl p-4 md:p-6 shadow-xl border transition-all",
          themeConfig.card.background,
          themeConfig.card.border
        )}>
          <div className="grid grid-cols-5 gap-2 md:gap-3 aspect-square max-w-2xl mx-auto">
            {items.map((item, index) => {
              if (index === 12) {
                return (
                  <div 
                    key={item.id}
                    data-testid={`bingo-square-${index}`}
                    className={cn(
                      "relative flex flex-col items-center justify-center p-2 rounded-xl shadow-lg aspect-square",
                      themeConfig.freeSpace.gradient,
                      themeConfig.freeSpace.text
                    )}
                  >
                    <Star className="w-5 h-5 md:w-6 md:h-6 fill-yellow-400 text-yellow-400" />
                    <span className="text-[10px] md:text-xs font-bold mt-1 uppercase">Free</span>
                  </div>
                );
              }

              const isEmpty = !item.text.trim();

              return (
                <div 
                  key={item.id}
                  className={cn(
                    "relative flex items-center justify-center p-1 md:p-2 rounded-xl text-center border-2 transition-all cursor-pointer aspect-square overflow-hidden",
                    isEmpty 
                      ? cn("border-dashed", themeConfig.square.border, "opacity-60")
                      : cn(themeConfig.square.background, themeConfig.square.border, themeConfig.square.text)
                  )}
                >
                  <div
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => updateItem(index, e.currentTarget.textContent || '')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        (e.target as HTMLElement).blur();
                      }
                    }}
                    onInput={(e) => {
                      const content = e.currentTarget.textContent || '';
                      if (content.length > 100) {
                        e.currentTarget.textContent = content.slice(0, 100);
                      }
                    }}
                    className={cn(
                      "w-full flex items-center justify-center text-center bg-transparent focus:outline-none focus:ring-2 focus:ring-primary rounded leading-tight break-words hyphens-auto",
                      isEmpty && "text-muted-foreground"
                    )}
                    style={{
                      fontSize: item.text.length > 50 
                        ? '0.45rem' 
                        : item.text.length > 30 
                          ? '0.5rem' 
                          : item.text.length > 15 
                            ? '0.55rem' 
                            : '0.6rem',
                      lineHeight: 1.2,
                    }}
                    data-testid={`input-item-${index}`}
                  >
                    {item.text}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link href={`/my-cards/${cardId}`} className="flex-1">
            <Button variant="outline" className="w-full" data-testid="button-cancel">
              Cancel
            </Button>
          </Link>
          <Button 
            onClick={handleSave} 
            disabled={!isComplete || updateCard.isPending}
            className="flex-1"
            data-testid="button-save-card"
          >
            <Save className="mr-2 w-4 h-4" />
            {updateCard.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}
