import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-2 border-dashed shadow-xl">
        <CardContent className="pt-6 flex flex-col items-center text-center">
          <div className="mb-4 rounded-full bg-destructive/10 p-4">
            <AlertCircle className="h-10 w-10 text-destructive" />
          </div>
          <h1 className="text-4xl font-bold font-display tracking-tight text-foreground mb-2">
            404
          </h1>
          <p className="text-muted-foreground mb-8 text-lg">
            Whoops! This page must have gotten lost in the shuffle.
          </p>

          <Link href="/">
            <Button size="lg" className="w-full">
              Back to Dashboard
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
