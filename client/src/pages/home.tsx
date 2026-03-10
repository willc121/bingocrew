import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight } from "lucide-react";

export default function Home() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && user) {
      setLocation("/my-cards");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  return null;
}

function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-purple-50/50 to-pink-50/50 dark:from-background dark:via-purple-950/20 dark:to-pink-950/20">
      <header className="px-6 py-4 flex items-center justify-between container mx-auto">
        <span className="font-display font-bold text-2xl text-foreground">Bingo Crew</span>
        <a href="/api/login">
          <Button variant="outline">Sign In</Button>
        </a>
      </header>
      
      <main className="flex-1 container mx-auto flex flex-col items-center justify-center text-center px-4 py-20">
        <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground hover:bg-primary/80 mb-8">
          New Year, New Habits
        </div>
        <h1 className="text-4xl md:text-7xl font-display font-bold tracking-tight text-foreground mb-6 max-w-4xl">
          Turn your goals into a <span className="text-gradient">social game</span>.
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl leading-relaxed">
          Create shared bingo cards with friends, coworkers, or family. Track progress, complete challenges, and celebrate wins together.
        </p>
        <div className="flex gap-4">
          <Link href="/my-cards/create">
            <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-lg hover:shadow-primary/25 transition-all hover:-translate-y-1">
              Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
        
        {/* Visual Demo */}
        <div className="mt-20 w-full max-w-4xl p-4 bg-white/40 dark:bg-black/40 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl">
           <div className="grid grid-cols-5 gap-2 aspect-[3/1] opacity-50 pointer-events-none">
             {Array.from({length: 15}).map((_, i) => (
               <div key={i} className={`rounded-lg ${i % 2 === 0 ? 'bg-primary/20' : 'bg-muted'} animate-pulse`} />
             ))}
           </div>
        </div>
      </main>
    </div>
  );
}
