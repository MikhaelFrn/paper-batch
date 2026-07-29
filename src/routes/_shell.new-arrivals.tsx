import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { ComicCard, PublisherBadge } from "@/components/comic-card";
import { Button } from "@/components/ui/button";
import { useRecentIssues } from "@/hooks/useIssues";
import { usePublishers } from "@/hooks/usePublishers";
import { issueToComic } from "@/lib/mock-data";

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
  const publishers = usePublishers();
  const issues = useRecentIssues(60);

  const weekly = (issues.data ?? [])
    .map((i) => issueToComic(i))
    .filter((c) => (pub ? c.publisher === pub : true));

  return (
    <div>
      <PageHeader
        eyebrow="Wednesday drops"
        title="New Arrivals"
        description="Latest issues fresh from the printer. Filter by publisher or dive straight into the week."
      />
      <div className="mb-6 flex flex-wrap gap-2">
        <Button size="sm" variant={!pub ? "default" : "outline"} onClick={() => setPub(null)}>All</Button>
        {(publishers.data ?? []).map((p) => (
          <Button key={p.id} size="sm" variant={pub === p.name ? "default" : "outline"} onClick={() => setPub(p.name)}>
            <PublisherBadge publisher={p.name} />
          </Button>
        ))}
      </div>

      <div className="mb-4 text-xs uppercase tracking-widest text-muted-foreground">
        Week of {new Date().toLocaleDateString(undefined, { month: "long", day: "numeric" })}
      </div>
      {issues.isLoading ? (
        <div className="py-10 text-sm text-muted-foreground">Loading new arrivals…</div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
          {weekly.map((c) => (
            <ComicCard key={c.id} comic={c} />
          ))}
        </div>
      )}
    </div>
  );
}
