import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { LogOut, ScanBarcode, Search, Settings, User as UserIcon } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
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
import { useSearch } from "@/hooks/useSearch";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { issueToComic } from "@/lib/comic-adapters";
import { toast } from "sonner";

/** Local-catalog-only quick suggestions while typing — no ComicVine calls,
 * unlike the full /search page's cvSearch. Just enough to jump straight to
 * a comic you already have; anything more (series/creators/CV results)
 * still needs the full search page. */
function SearchSuggestions({
  query,
  onNavigate,
}: {
  query: string;
  onNavigate: (issueId: string) => void;
}) {
  const debouncedQuery = useDebouncedValue(query, 250);
  const results = useSearch(debouncedQuery, { limit: 6 });
  const issues = results.data?.issues ?? [];

  return (
    <div className="absolute inset-x-0 top-full z-50 mt-1 overflow-hidden rounded-md border border-border bg-popover shadow-lg">
      {results.isLoading ? (
        <div className="p-3 text-sm text-muted-foreground">Searching your catalog…</div>
      ) : issues.length === 0 ? (
        <div className="p-3 text-sm text-muted-foreground">No matches in your catalog.</div>
      ) : (
        <ul className="max-h-80 overflow-y-auto py-1">
          {issues.map((issue) => {
            const c = issueToComic(issue);
            return (
              <li key={issue.id}>
                <button
                  type="button"
                  // mousedown, not click — fires before the input's onBlur
                  // closes this dropdown, so the navigation isn't lost to
                  // the blur race.
                  onMouseDown={() => onNavigate(issue.id)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                >
                  <span className="truncate font-medium">{c.series} #{c.issue}</span>
                  <span className="ml-auto shrink-0 truncate text-xs text-muted-foreground">{c.title}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function Topbar() {
  const navigate = useNavigate();
  const { data: user } = useCurrentUser();
  const { data: profile } = useMyProfile();
  const signOut = useSignOut();
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
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
          const trimmed = query.trim();
          if (!trimmed) return;
          setShowSuggestions(false);
          setQuery("");
          navigate({ to: "/search", search: { q: trimmed } });
        }}
        className="relative flex-1 max-w-xl"
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => query.trim() && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setShowSuggestions(false);
          }}
          placeholder="Search comics, series, writers, characters…"
          className="h-9 border-border/60 bg-muted/50 pl-9 pr-14 focus-visible:ring-primary/40"
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline">
          ⌘K
        </kbd>

        {showSuggestions && query.trim() && (
          <SearchSuggestions
            query={query}
            onNavigate={(issueId) => {
              setShowSuggestions(false);
              setQuery("");
              navigate({ to: "/comic/$id", params: { id: issueId } });
            }}
          />
        )}
      </form>

      <div className="ml-auto flex items-center gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link to="/scan"><ScanBarcode className="h-4 w-4" />Scan</Link>
        </Button>
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
