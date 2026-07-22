import { createFileRoute } from "@tanstack/react-router";
import { Camera } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PublisherBadge } from "@/components/comic-card";
import { favoriteArtists, favoritePublishers, favoriteSeries, favoriteWriters, stats } from "@/lib/mock-data";

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

function Profile() {
  return (
    <div>
      <PageHeader eyebrow="Account" title="Profile" description="Edit your details and see your collection stats." />

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Card className="border-border/60">
          <CardContent className="flex flex-col items-center p-6 text-center">
            <div className="relative">
              <Avatar className="h-24 w-24 ring-2 ring-primary/50">
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-2xl font-bold text-white">PB</AvatarFallback>
              </Avatar>
              <Button size="icon" className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full"><Camera className="h-4 w-4" /></Button>
            </div>
            <div className="mt-4 font-display text-xl tracking-wide">Peter B. Parker</div>
            <div className="text-xs text-muted-foreground">@webhead</div>
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
              <div><Label>Username</Label><Input defaultValue="webhead" /></div>
              <div><Label>Display name</Label><Input defaultValue="Peter B. Parker" /></div>
              <div className="sm:col-span-2"><Label>Email</Label><Input defaultValue="peter@dailybugle.com" /></div>
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
              <Stat label="Publishers" value={favoritePublishers.length} />
              <Stat label="Series" value={favoriteSeries.length} />
            </div>
          </div>

          <Card className="border-border/60">
            <CardHeader><CardTitle>Taste profile</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <div className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Favorite publishers</div>
                <div className="flex flex-wrap gap-2">{favoritePublishers.map((p) => <PublisherBadge key={p} publisher={p} />)}</div>
              </div>
              <div>
                <div className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Favorite series</div>
                <div className="flex flex-wrap gap-2">{favoriteSeries.map((s) => <span key={s} className="rounded-md border border-border bg-muted/40 px-2 py-1 text-xs">{s}</span>)}</div>
              </div>
              <div>
                <div className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Favorite writers</div>
                <div className="flex flex-wrap gap-2">{favoriteWriters.map((s) => <span key={s} className="rounded-md border border-border bg-muted/40 px-2 py-1 text-xs">{s}</span>)}</div>
              </div>
              <div>
                <div className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Favorite artists</div>
                <div className="flex flex-wrap gap-2">{favoriteArtists.map((s) => <span key={s} className="rounded-md border border-border bg-muted/40 px-2 py-1 text-xs">{s}</span>)}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
