import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { 
  LogOut, 
  Bell, 
  Plus, 
  LayoutGrid, 
  Menu,
  User as UserIcon
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNotifications } from "@/hooks/use-notifications";
import { Badge } from "@/components/ui/badge";

export function NavBar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const { data: notifications } = useNotifications();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const unreadCount = Array.isArray(notifications) 
    ? notifications.filter((n: any) => !n.read).length 
    : 0;

  if (!user) return null;

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-4 md:px-6">
        {/* Mobile Menu */}
        <div className="md:hidden mr-2">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <div className="flex flex-col gap-4 mt-8">
                <Link href="/my-cards" onClick={() => setMobileMenuOpen(false)} className="text-lg font-semibold flex items-center gap-2">
                  <UserIcon className="h-5 w-5" /> My Cards
                </Link>
                <Link href="/groups" onClick={() => setMobileMenuOpen(false)} className="text-lg font-semibold flex items-center gap-2">
                  <LayoutGrid className="h-5 w-5" /> Groups
                </Link>
                <div className="flex-1" />
                <Button variant="outline" onClick={() => { logout(); setMobileMenuOpen(false); }}>
                  Log out
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Logo */}
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <span className="font-display font-bold text-2xl text-gradient">
            Bingo Crew
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center space-x-6 text-sm font-medium">
          <Link 
            href="/my-cards" 
            className={`transition-colors hover:text-foreground/80 ${location === '/' || location.startsWith('/my-cards') ? 'text-foreground' : 'text-foreground/60'}`}
          >
            My Cards
          </Link>
          <Link 
            href="/groups" 
            className={`transition-colors hover:text-foreground/80 ${location.startsWith('/groups') ? 'text-foreground' : 'text-foreground/60'}`}
          >
            Groups
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-4">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 rounded-full text-[10px]">
                {unreadCount}
              </Badge>
            )}
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9 border-2 border-primary/20">
                  <AvatarImage src={user.profileImageUrl || undefined} alt={user.firstName || "User"} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {user.firstName?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.firstName} {user.lastName}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => logout()} className="text-red-600 focus:text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
