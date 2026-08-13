import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { ComicCard, PublisherBadge } from "@/components/comic-card";
import { Button } from "@/components/ui/button";
import { useNewArrivals } from "@/hooks/useComicVine";
import { cvIssueToComic } from "@/lib/comic-adapters";
import { getKnownSafeErrorKind } from "@/lib/rate-limit-messages";
import { useTranslation } from "@/i18n";

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
  const { t, locale } = useTranslation();
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

  const errorKind = getKnownSafeErrorKind(arrivals.error);

  return (
    <div>
      <PageHeader
        eyebrow={t.newArrivals.eyebrow}
        title={t.newArrivals.title}
        description={t.newArrivals.description}
      />
      <div className="mb-6 flex flex-wrap gap-2">
        <Button size="sm" variant={!pub ? "default" : "outline"} onClick={() => setPub(null)}>{t.newArrivals.all}</Button>
        {publishers.map((name) => (
          <Button key={name} size="sm" variant={pub === name ? "default" : "outline"} onClick={() => setPub(name)}>
            <PublisherBadge publisher={name} />
          </Button>
        ))}
      </div>

      <div className="mb-4 text-xs uppercase tracking-widest text-muted-foreground">
        {t.newArrivals.weekOf(
          new Date().toLocaleDateString(locale === "fr" ? "fr-CA" : "en-US", { month: "long", day: "numeric" }),
        )}
      </div>
      {arrivals.isLoading ? (
        <div className="py-10 text-sm text-muted-foreground">{t.newArrivals.loading}</div>
      ) : arrivals.isError ? (
        <div className="py-10 text-sm text-destructive">
          {errorKind ? t.errors[errorKind] : t.newArrivals.loadFailed}
        </div>
      ) : weekly.length === 0 ? (
        <div className="py-10 text-sm text-muted-foreground">{t.newArrivals.none}</div>
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
