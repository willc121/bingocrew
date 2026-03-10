import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useCreatePersonalCard } from "@/hooks/use-my-cards";
import { useLocalCards } from "@/hooks/use-local-cards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Wand2, Star } from "lucide-react";
import { Link } from "wouter";
import { THEME_OPTIONS, getTheme } from "@shared/themes";
import { cn } from "@/lib/utils";

const CATEGORIES = {
  health: ["Drink 2L Water", "Walk 10k Steps", "Sleep 8 Hours", "Meditate 10 Min", "No Sugar Day", "Workout 30 Min", "Stretch Daily", "Take Vitamins"],
  finance: ["Save $50", "Review Budget", "No Impulse Buy", "Track Expenses", "Pay Bill On Time", "Learn Investing", "Side Hustle Hour"],
  learning: ["Read 10 Pages", "Learn New Word", "Online Course", "Listen Podcast", "Watch Documentary", "Practice Skill", "Journal Ideas"],
  social: ["Call a Friend", "Compliment Someone", "Help a Stranger", "Family Time", "Send Thank You", "Meet Someone New"],
  home: ["Clean Desk", "Organize Closet", "Cook a Meal", "Try New Recipe", "Water Plants", "Declutter Room", "Home Project"],
  adventure: ["Visit Park", "Try New Food", "Explore Neighborhood", "Take Photos", "Go Somewhere New", "Say Yes to Something"],
  wellness: ["No Social Media", "Digital Detox Hour", "Gratitude List", "Deep Breathing", "Early Bedtime", "Morning Routine"],
  productivity: ["Plan Week", "Finish Task", "Inbox Zero", "Learn Shortcut", "Automate Something", "Review Goals"]
};

function createEmptyItems() {
  return Array.from({ length: 25 }, (_, i) => ({
    id: `item-${i}-${Date.now()}`,
    text: i === 12 ? "FREE SPACE" : "",
    category: i === 12 ? "free" : undefined
  }));
}

function generateRandomItems() {
  const allItems: { id: string; text: string; category: string }[] = [];
  const entries = Object.entries(CATEGORIES);
  
  entries.forEach(([category, items]) => {
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    shuffled.slice(0, 3).forEach((text, i) => {
      allItems.push({ id: `${category}-${i}-${Date.now()}`, text, category });
    });
  });
  
  const shuffled = allItems.sort(() => Math.random() - 0.5).slice(0, 24);
  const result = [
    ...shuffled.slice(0, 12),
    { id: 'free-center', text: 'FREE SPACE', category: 'free' },
    ...shuffled.slice(12)
  ];
  
  return result;
}

export default function CreatePersonalCardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const createServerCard = useCreatePersonalCard();
  const { createCard: createLocalCard } = useLocalCards();
  const { toast } = useToast();
  
  const [title, setTitle] = useState("");
  const [theme, setTheme] = useState("default");
  const [items, setItems] = useState<{ id: string; text: string; category?: string }[]>(createEmptyItems);

  const themeConfig = getTheme(theme);

  const handleQuickFill = () => {
    const generated = generateRandomItems();
    setItems(generated);
    toast({ title: "Card filled!", description: "24 random goals generated. Click any square to edit." });
  };

  const updateItem = (index: number, text: string) => {
    if (index === 12) return;
    const trimmedText = text.slice(0, 100);
    const newItems = [...items];
    newItems[index] = { ...newItems[index], text: trimmedText };
    setItems(newItems);
  };

  const filledCount = items.filter((item, i) => i !== 12 && item.text.trim()).length;
  const hasTitle = title.trim().length > 0;

  const handleCreate = async () => {
    if (!title.trim()) {
      toast({ title: "Title required", description: "Give your card a name.", variant: "destructive" });
      return;
    }

    const finalItems = items.map((item, i) => {
      if (i === 12) return item;
      if (!item.text.trim()) {
        return { ...item, text: "TBD" };
      }
      return item;
    });

    const emptyCount = 24 - filledCount;
    
    try {
      if (user) {
        const card = await createServerCard.mutateAsync({ title, theme, items: finalItems });
        if (emptyCount > 0) {
          toast({ title: "Card created!", description: `${emptyCount} empty squares filled with "TBD". You can edit them anytime.` });
        } else {
          toast({ title: "Card created!", description: "Start tracking your progress." });
        }
        navigate(`/my-cards/${card.id}`);
      } else {
        const card = createLocalCard({ title, theme, items: finalItems });
        if (emptyCount > 0) {
          toast({ title: "Card created!", description: `${emptyCount} empty squares filled with "TBD". Sign in to sync it to your account.` });
        } else {
          toast({ title: "Card created!", description: "Card saved on this device. Sign in to sync it to your account." });
        }
        navigate(`/local-cards/${card.id}`);
      }
    } catch {
      toast({ title: "Error", description: "Failed to create card.", variant: "destructive" });
    }
  };

  if (authLoading) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/my-cards">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Create Your Bingo Card</h1>
          <p className="text-muted-foreground">Click any square to add your goals</p>
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

        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            {filledCount}/24 squares filled
          </div>
          
          <Button 
            onClick={handleQuickFill} 
            variant="outline"
            data-testid="button-quick-fill"
          >
            <Wand2 className="mr-2 w-4 h-4" /> Generate Random Goals
          </Button>
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
                    {item.text || `#${index + 1}`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <Button 
          onClick={handleCreate} 
          disabled={!hasTitle || createServerCard.isPending}
          className="w-full h-12 text-lg"
          data-testid="button-create-card"
        >
          {createServerCard.isPending ? 'Creating...' : filledCount < 24 ? `Create Card (${24 - filledCount} will be "TBD")` : 'Create My Bingo Card'}
        </Button>
      </div>
    </div>
  );
}
