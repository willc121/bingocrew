import { useState } from "react";
import { useJoinGroup } from "@/hooks/use-groups";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Users } from "lucide-react";

export function JoinGroupDialog() {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const { mutate: joinGroup, isPending } = useJoinGroup();

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    
    joinGroup({ code }, {
      onSuccess: () => setOpen(false)
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-24 flex flex-col gap-2 hover:border-primary hover:text-primary transition-colors">
          <Users className="w-8 h-8" />
          <span className="font-semibold">Join Group</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleJoin}>
          <DialogHeader>
            <DialogTitle>Join a Bingo Crew</DialogTitle>
            <DialogDescription>
              Enter the invite code shared by your group admin.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="code">Invite Code</Label>
              <Input
                id="code"
                placeholder="e.g. AB12CD"
                className="uppercase tracking-widest text-center text-lg font-mono"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending || code.length < 4}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Join Crew
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
