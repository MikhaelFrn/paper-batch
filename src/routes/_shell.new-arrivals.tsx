import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { ComicCard, PublisherBadge } from "@/components/comic-card";
import { Button } from "@/components/ui/button";
import { useNewArrivals } from "@/hooks/useComicVine";
import { cvIssueToComic } from "@/lib/comic-adapters";
import { getKnownSafeErrorMessage } from "@/lib/rate-limit-messages";

export const Route = createFileRoute("/_shell/new-arrivals")({
  head: () => ({
    meta: [
      { title: "New Arrivals · Comic Vault" },
      { name: "description", content: "This week's new comic releases from Marvel, DC, Image, and more." },
      { property: "og:title", content: "New comic releases this week — Comic Vault" },
      { property: "og:description", content: "Fresh drops across every publisher, updated weekly." },
    ],
  }),
  component: NewArrivals,
});

function NewArrivals() {
  const [pub, setPub] = useState<string | null>(null);
  const arrivals = useNewArrivals();
  const issues = arrivals.data ?? [];

  const publishers = useMemo(
    () => [...new Set(issues.map((i) => i.publisherName))].sort(),
    [issues],
  );
  const weekly = issues
    .filter((i) => (pub ? i.publisherName === pub : true))
    .map((i) => cvIssueToComic(i, i.publisherName));

  return (
    <div>
      <PageHeader
        eyebrow="This week"
        title="New Arrivals"
        description="Latest issues from Marvel, DC, Image, and more. Click any cover to add it to your collection."
      />
      <div className="mb-6 flex flex-wrap gap-2">
        <Button size="sm" variant={!pub ? "default" : "outline"} onClick={() => setPub(null)}>All</Button>
        {publishers.map((name) => (
          <Button key={name} size="sm" variant={pub === name ? "default" : "outline"} onClick={() => setPub(name)}>
            <PublisherBadge publisher={name} />
          </Button>
        ))}
      </div>

      <div className="mb-4 text-xs uppercase tracking-widest text-muted-foreground">
        Week of {new Date().toLocaleDateString(undefined, { month: "long", day: "numeric" })}
      </div>
      {arrivals.isLoading ? (
        <div className="py-10 text-sm text-muted-foreground">Loading new arrivals…</div>
      ) : arrivals.isError ? (
        <div className="py-10 text-sm text-destructive">
          {getKnownSafeErrorMessage(arrivals.error) ?? "Couldn't load new arrivals — try again in a moment."}
        </div>
      ) : weekly.length === 0 ? (
        <div className="py-10 text-sm text-muted-foreground">No new arrivals found for this week.</div>
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
