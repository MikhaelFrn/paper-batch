import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { ComicCard, PublisherBadge } from "@/components/comic-card";
import { Button } from "@/components/ui/button";
import { comicsService } from "@/services/comics";
import { useNewArrivals } from "@/hooks/queries";

export const Route = createFileRoute("/_shell/new-arrivals")({
  head: () => ({
    meta: [
      { title: "New Arrivals · Longbox" },
      { name: "description", content: "This week's new comic releases from Marvel, DC, Image, and more." },
      { property: "og:title", content: "New comic releases this week — Longbox" },
      { property: "og:description", content: "Fresh drops across every publisher, updated weekly." },
    ],
  }),
  component: NewArrivals,
});

function NewArrivals() {
  const [pub, setPub] = useState<string | null>(null);
  const publishers = comicsService.publishers();
  const { data: weekly = [] } = useNewArrivals(pub);

  return (
    <div>
      <PageHeader
        eyebrow="Wednesday drops"
        title="New Arrivals"
        description="Latest issues fresh from the printer. Filter by publisher or dive straight into the week."
      />
      <div className="mb-6 flex flex-wrap gap-2">
        <Button size="sm" variant={!pub ? "default" : "outline"} onClick={() => setPub(null)}>All</Button>
        {publishers.map((p) => (
          <Button key={p} size="sm" variant={pub === p ? "default" : "outline"} onClick={() => setPub(p)}>
            <PublisherBadge publisher={p} />
          </Button>
        ))}
      </div>

      <div className="mb-4 text-xs uppercase tracking-widest text-muted-foreground">
        Week of {new Date().toLocaleDateString(undefined, { month: "long", day: "numeric" })}
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
        {weekly.map((c) => (
          <ComicCard key={c.id} comic={c} />
        ))}
      </div>
    </div>
  );
}
