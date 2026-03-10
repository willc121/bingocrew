import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NavBar } from "@/components/NavBar";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Groups from "@/pages/groups";
import CreateGroup from "@/pages/create-group";
import GroupDetail from "@/pages/group-detail";
import MyCards from "@/pages/my-cards";
import MyCardDetail from "@/pages/my-card-detail";
import CreatePersonalCard from "@/pages/create-personal-card";
import EditPersonalCard from "@/pages/edit-personal-card";
import TrashPage from "@/pages/trash";
import LocalCardDetail from "@/pages/local-card-detail";

function Router() {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/groups" component={Groups} />
          <Route path="/groups/create" component={CreateGroup} />
          <Route path="/groups/:id" component={GroupDetail} />
          <Route path="/my-cards" component={MyCards} />
          <Route path="/my-cards/create" component={CreatePersonalCard} />
          <Route path="/my-cards/:id/edit" component={EditPersonalCard} />
          <Route path="/my-cards/:id" component={MyCardDetail} />
          <Route path="/trash" component={TrashPage} />
          <Route path="/local-cards/:id" component={LocalCardDetail} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
