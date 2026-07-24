import { createFileRoute } from "@tanstack/react-router";
import { Bookmark, Share2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ComicCard } from "@/components/comic-card";
import { Button } from "@/components/ui/button";
import { useWishlist } from "@/hooks/queries";

export const Route = createFileRoute("/_shell/wishlist")({
  head: () => ({
    meta: [
      { title: "Wishlist · Longbox" },
      { name: "description", content: "Comics you're chasing — organized, prioritized, and share-ready." },
      { property: "og:title", content: "My comic wishlist — Longbox" },
      { property: "og:description", content: "The next stack of issues to hunt down." },
    ],
  }),
  component: Wishlist,
});

function Wishlist() {
  const { data: list = [] } = useWishlist();
  return (
    <div>
      <PageHeader
        eyebrow="Default list"
        title="Wishlist"
        description={`${list.length} issues you're chasing`}
        actions={<Button variant="outline" size="sm"><Share2 className="h-4 w-4" />Share</Button>}
      />
      {list.length === 0 ? (
        <div className="grid place-items-center rounded-xl border border-dashed border-border py-20 text-center">
          <Bookmark className="mb-3 h-8 w-8 text-muted-foreground" />
          <div className="font-medium">Your wishlist is empty</div>
          <div className="text-sm text-muted-foreground">Bookmark any comic to add it here.</div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
          {list.map((c) => <ComicCard key={c.id} comic={c} />)}
        </div>
      )}
    </div>
  );
}
