import { createFileRoute } from "@tanstack/react-router";
import { Camera } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PublisherBadge } from "@/components/comic-card";
import { useMyProfile } from "@/hooks/useProfiles";
import { useUserCollection } from "@/hooks/useUserComics";
import {
  useFavoriteSeries,
  useFavoritePublishers,
  useFavoriteCreators,
} from "@/hooks/useFavorites";
import { useMyLists, useList } from "@/hooks/useLists";

export const Route = createFileRoute("/_shell/profile")({
  head: () => ({
    meta: [
      { title: "Profile · Longbox" },
      { name: "description", content: "Manage your Longbox profile and collection stats." },
      { property: "og:title", content: "My profile — Longbox" },
      { property: "og:description", content: "Edit your details and see your collection at a glance." },
    ],
  }),
  component: Profile,
});

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-card/60 p-4 text-center">
      <div className="font-display text-3xl">{value}</div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "?";
}

function Profile() {
  const profile = useMyProfile();
  const collection = useUserCollection();
  const favSeries = useFavoriteSeries();
  const favPublishers = useFavoritePublishers();
  const favCreators = useFavoriteCreators();
  const lists = useMyLists();
  const wishlistList = lists.data?.find((l) => l.type === "wishlist");
  const wishlistDetail = useList(wishlistList?.id);

  const entries = collection.data ?? [];
  const stats = {
    owned: entries.filter((e) => e.owned).length,
    read: entries.filter((e) => e.read).length,
    wishlist: wishlistDetail.data?.list_items?.length ?? 0,
    favorites:
      (favSeries.data?.length ?? 0) +
      (favPublishers.data?.length ?? 0) +
      (favCreators.data?.length ?? 0),
    lists: lists.data?.length ?? 0,
    totalIssues: entries.length,
  };

  const displayName = profile.data?.display_name ?? profile.data?.username ?? "";
  const username = profile.data?.username ?? "";
  const email = profile.data?.email ?? "";

  return (
    <div>
      <PageHeader eyebrow="Account" title="Profile" description="Edit your details and see your collection stats." />

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Card className="border-border/60">
          <CardContent className="flex flex-col items-center p-6 text-center">
            <div className="relative">
              <Avatar className="h-24 w-24 ring-2 ring-primary/50">
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-2xl font-bold text-white">{initials(displayName || username || "?")}</AvatarFallback>
              </Avatar>
              <Button size="icon" className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full"><Camera className="h-4 w-4" /></Button>
            </div>
            <div className="mt-4 font-display text-xl tracking-wide">{displayName || "—"}</div>
            <div className="text-xs text-muted-foreground">@{username || "—"}</div>
            <div className="mt-4 grid w-full grid-cols-2 gap-2 text-xs">
              <div className="rounded bg-muted/40 p-2"><div className="font-semibold">{stats.owned}</div><div className="text-muted-foreground">Owned</div></div>
              <div className="rounded bg-muted/40 p-2"><div className="font-semibold">{stats.read}</div><div className="text-muted-foreground">Read</div></div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-border/60">
            <CardHeader><CardTitle>Account details</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div><Label>Username</Label><Input defaultValue={username} /></div>
              <div><Label>Display name</Label><Input defaultValue={displayName} /></div>
              <div className="sm:col-span-2"><Label>Email</Label><Input defaultValue={email} /></div>
              <div><Label>New password</Label><Input type="password" placeholder="••••••••" /></div>
              <div><Label>Confirm password</Label><Input type="password" placeholder="••••••••" /></div>
              <div className="sm:col-span-2 flex justify-end gap-2">
                <Button variant="outline">Cancel</Button>
                <Button>Save changes</Button>
              </div>
            </CardContent>
          </Card>

          <div>
            <h3 className="font-display mb-3 text-lg tracking-wide">Collection stats</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Owned" value={stats.owned} />
              <Stat label="Read" value={stats.read} />
              <Stat label="Wishlist" value={stats.wishlist} />
              <Stat label="Favorites" value={stats.favorites} />
              <Stat label="Custom lists" value={stats.lists} />
              <Stat label="Total issues" value={stats.totalIssues.toLocaleString()} />
              <Stat label="Publishers" value={favPublishers.data?.length ?? 0} />
              <Stat label="Series" value={favSeries.data?.length ?? 0} />
            </div>
          </div>

          <Card className="border-border/60">
            <CardHeader><CardTitle>Taste profile</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <div className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Favorite publishers</div>
                <div className="flex flex-wrap gap-2">{(favPublishers.data ?? []).map((p) => <PublisherBadge key={p.id} publisher={p.name} />)}</div>
              </div>
              <div>
                <div className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Favorite series</div>
                <div className="flex flex-wrap gap-2">{(favSeries.data ?? []).map((s) => <span key={s.id} className="rounded-md border border-border bg-muted/40 px-2 py-1 text-xs">{s.name}</span>)}</div>
              </div>
              <div>
                <div className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Favorite creators</div>
                <div className="flex flex-wrap gap-2">{(favCreators.data ?? []).map((c) => <span key={c.id} className="rounded-md border border-border bg-muted/40 px-2 py-1 text-xs">{[c.first_name, c.last_name].filter(Boolean).join(" ")}</span>)}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
