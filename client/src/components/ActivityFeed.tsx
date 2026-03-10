import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trophy, CheckSquare, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Event {
  id: string;
  type: "completed_square" | "bingo" | "joined_group";
  payload: any;
  createdAt: string;
  user?: {
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
  };
}

export function ActivityFeed({ events }: { events: Event[] }) {
  if (!events || events.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground text-sm">
        No activity yet. Be the first!
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px] pr-4">
      <div className="space-y-4">
        {events.map((event) => (
          <div key={event.id} className="flex gap-4 items-start group">
            <Avatar className="w-8 h-8 border border-border mt-1">
              <AvatarImage src={event.user?.profileImageUrl} />
              <AvatarFallback className="text-[10px]">
                {event.user?.firstName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium leading-none">
                  {event.user?.firstName}
                </p>
                <span className="text-[10px] text-muted-foreground">
                  {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
                </span>
              </div>
              <p className={cn("text-sm", 
                event.type === 'bingo' ? "text-primary font-bold" : "text-muted-foreground"
              )}>
                {renderEventMessage(event)}
              </p>
            </div>
            <div className="shrink-0">
               {renderEventIcon(event.type)}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

function renderEventMessage(event: Event) {
  switch (event.type) {
    case "completed_square":
      return (
        <span>
          Completed <span className="text-foreground font-medium">"{event.payload.squareText}"</span>
        </span>
      );
    case "bingo":
      return "🎉 GOT BINGO!";
    case "joined_group":
      return "Joined the crew!";
    default:
      return "Did something cool";
  }
}

function renderEventIcon(type: string) {
  switch (type) {
    case "bingo":
      return <Trophy className="w-4 h-4 text-yellow-500" />;
    case "completed_square":
      return <CheckSquare className="w-4 h-4 text-green-500" />;
    case "joined_group":
      return <UserPlus className="w-4 h-4 text-blue-500" />;
    default:
      return null;
  }
}
