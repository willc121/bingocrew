import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useGroups } from "@/hooks/use-groups";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Users, ArrowRight } from "lucide-react";

export default function Groups() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: groups, isLoading: groupsLoading } = useGroups();

  if (authLoading) {
    return (
      <div className="container max-w-4xl mx-auto py-12 px-4">
        <Skeleton className="h-10 w-48 mb-8" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container max-w-4xl mx-auto py-12 px-4 text-center">
        <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Sign in to view Groups</h1>
        <p className="text-muted-foreground mb-6">Create and join groups to track goals with friends.</p>
        <a href="/api/login">
          <Button>Sign In</Button>
        </a>
      </div>
    );
  }

  const hasGroups = groups && groups.length > 0;

  return (
    <div className="container max-w-4xl mx-auto py-12 px-4">
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-display font-bold" data-testid="text-groups-title">My Groups</h1>
          <p className="text-muted-foreground">Track goals together with friends.</p>
        </div>
        <Link href="/groups/create">
          <Button data-testid="button-create-group">
            <Plus className="mr-2 h-4 w-4" />
            Create Group
          </Button>
        </Link>
      </div>

      {groupsLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : hasGroups ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <Link key={group.id} href={`/groups/${group.id}`}>
              <Card className="hover-elevate cursor-pointer h-full" data-testid={`card-group-${group.id}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">{group.emoji}</span>
                    <span className="truncate">{group.name}</span>
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm text-muted-foreground">
                    View group <ArrowRight className="ml-1 h-3 w-3" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No groups yet</h3>
            <p className="text-muted-foreground mb-4">Create a group to start tracking goals with friends.</p>
            <Link href="/groups/create">
              <Button data-testid="button-create-first-group">
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Group
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
