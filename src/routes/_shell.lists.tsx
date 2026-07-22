import { createFileRoute } from "@tanstack/react-router";
import { GripVertical, Lock, Globe, Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { customLists, getComic, publisherAccent } from "@/lib/mock-data";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_shell/lists")({
  head: () => ({
    meta: [
      { title: "Custom Lists · Longbox" },
      { name: "description", content: "Organize your comics into unlimited custom lists." },
      { property: "og:title", content: "Custom comic lists — Longbox" },
      { property: "og:description", content: "Curate, rank, and share your own comic collections." },
    ],
  }),
  component: Lists,
});

function Lists() {
  return (
    <div>
      <PageHeader
        eyebrow="Curate"
        title="Custom Lists"
        description={`${customLists.length} lists · drag & drop to reorder`}
        actions={
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4" />New list</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a new list</DialogTitle>
                <DialogDescription>Give it a name, a description, and a vibe.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div><Label>Name</Label><Input placeholder="Best Cosmic Stories" /></div>
                <div><Label>Description</Label><Textarea placeholder="What's this list about?" /></div>
                <div className="flex items-center justify-between"><Label>Public</Label><Switch /></div>
              </div>
              <DialogFooter><Button>Create list</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {customLists.map((list) => {
          const preview = list.comicIds.map(getComic).filter(Boolean).slice(0, 4);
          return (
            <Card key={list.id} className="group cursor-pointer overflow-hidden border-border/60 transition hover:border-primary/40">
              <div className="relative h-32 w-full" style={{ backgroundImage: publisherAccent[list.coverPublisher] }}>
                <div className="absolute inset-0 opacity-25 mix-blend-overlay" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 0)", backgroundSize: "8px 8px" }} />
                <div className="absolute inset-0 flex items-end gap-1 p-3">
                  {preview.map((c) => (
                    <div key={c!.id} className="w-10">
                      <div className="aspect-[2/3] rounded-sm bg-black/40 shadow-md ring-1 ring-white/10" />
                    </div>
                  ))}
                </div>
                <span className="absolute right-2 top-2 rounded-md bg-black/60 px-2 py-0.5 text-[10px] text-white">
                  {list.isPublic ? <Globe className="inline h-3 w-3" /> : <Lock className="inline h-3 w-3" />} {list.isPublic ? "Public" : "Private"}
                </span>
                <GripVertical className="absolute left-2 top-2 h-4 w-4 text-white/60 opacity-0 group-hover:opacity-100" />
              </div>
              <CardHeader>
                <CardTitle className="font-display tracking-wide">{list.name}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="line-clamp-2 text-sm text-muted-foreground">{list.description}</p>
                <div className="mt-3 text-xs text-muted-foreground">{list.comicIds.length} comics</div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
