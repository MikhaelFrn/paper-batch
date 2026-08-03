import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Search, Settings, User as UserIcon } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { useCurrentUser } from "@/hooks/useAuth";
import { useMyProfile } from "@/hooks/useProfiles";
import { useSignOut } from "@/hooks/useAuth";
import { toast } from "sonner";


export function Topbar() {
  const navigate = useNavigate();
  const { data: user } = useCurrentUser();
  const { data: profile } = useMyProfile();
  const signOut = useSignOut();
  const handleSignOut = async () => {
  try {
    await signOut.mutateAsync();
    navigate({ to: "/login" });
  } catch {
    toast.error("Failed to sign out.");
  }
};
  const displayName =
  profile?.display_name ??
  profile?.username ??
  user?.email?.split("@")[0] ??
  "Collector";

  const email = user?.email ?? "";

  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/60 bg-background/80 px-3 backdrop-blur">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-6" />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          navigate({ to: "/search" });
        }}
        className="relative flex-1 max-w-xl"
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search comics, series, writers, characters…"
          className="h-9 border-border/60 bg-muted/50 pl-9 pr-14 focus-visible:ring-primary/40"
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline">
          ⌘K
        </kbd>
      </form>

      <div className="ml-auto flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full pl-1 pr-2 hover:bg-muted/60">
              <Avatar className="h-8 w-8 ring-2 ring-primary/60">
                <AvatarImage src={profile?.avatar_url ?? ""} alt={displayName} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-xs font-bold text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium sm:inline">{displayName}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="font-medium">{displayName}</div>
              <div className="text-xs text-muted-foreground">{email}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/profile"><UserIcon className="mr-2 h-4 w-4" />Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings"><Settings className="mr-2 h-4 w-4" />Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
