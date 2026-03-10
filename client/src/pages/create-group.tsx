import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useCreateGroup } from "@/hooks/use-groups";
import { useAuth } from "@/hooks/use-auth";
import { insertGroupSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, ArrowLeft, Users, User } from "lucide-react";
import { Link } from "wouter";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const schema = insertGroupSchema.extend({
  name: z.string().min(3, "Name must be at least 3 characters"),
  emoji: z.string().min(1, "Pick an emoji"),
  cardType: z.enum(["shared", "individual"]),
});

type FormData = z.infer<typeof schema>;

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

export default function CreateGroup() {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { mutate: createGroup, isPending } = useCreateGroup();
  
  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = '/api/login';
    }
  }, [user, authLoading]);
  
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      emoji: "🎯",
      theme: "default",
      cardType: "shared",
    },
  });

  if (authLoading || !user) {
    return (
      <div className="container max-w-lg mx-auto py-12 px-4">
        <Skeleton className="h-8 w-32 mb-6" />
        <Skeleton className="h-12 w-64 mb-4" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  const onSubmit = (data: FormData) => {
    createGroup(data, {
      onSuccess: (newGroup: any) => {
        // Redirect to group detail to set up the card
        setLocation(`/groups/${newGroup.id}`);
      },
    });
  };

  return (
    <div className="container max-w-lg mx-auto py-12 px-4">
      <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
      </Link>
      
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-display font-bold">Create New Group</h1>
        <p className="text-muted-foreground">Start a new challenge with your friends.</p>
      </div>

      <Card className="border-border/50 shadow-lg">
        <CardHeader>
          <CardTitle>Group Details</CardTitle>
          <CardDescription>Give your group a name and identity.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Group Name</Label>
              <Input 
                id="name" 
                placeholder="e.g. 2024 Fitness Challenge" 
                {...form.register("name")}
                className="text-lg"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Group Icon</Label>
              <div className="grid grid-cols-6 sm:grid-cols-9 gap-2">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => form.setValue("emoji", emoji)}
                    className={`text-2xl p-2 rounded-xl transition-all hover:bg-muted ${
                      form.watch("emoji") === emoji 
                        ? "bg-primary/10 ring-2 ring-primary scale-110" 
                        : "bg-muted/30"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Card Mode</Label>
              <RadioGroup
                value={form.watch("cardType")}
                onValueChange={(v: "shared" | "individual") => form.setValue("cardType", v)}
                className="grid grid-cols-1 gap-3"
              >
                <Label 
                  htmlFor="card-type-shared" 
                  className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                    form.watch("cardType") === "shared" 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <RadioGroupItem value="shared" id="card-type-shared" className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span className="font-medium">Shared Card</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Everyone tracks the same card. Compare progress on a leaderboard.
                    </p>
                  </div>
                </Label>
                <Label 
                  htmlFor="card-type-individual" 
                  className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                    form.watch("cardType") === "individual" 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <RadioGroupItem value="individual" id="card-type-individual" className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span className="font-medium">Individual Cards</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Each member uses their own personal card. View each other's progress.
                    </p>
                  </div>
                </Label>
              </RadioGroup>
            </div>

            <Separator />

            <div className="flex justify-end gap-3">
              <Link href="/">
                <Button variant="ghost" type="button">Cancel</Button>
              </Link>
              <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
                  </>
                ) : (
                  "Create & Setup Card"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
