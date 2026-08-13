import { describe, expect, it } from "vitest";
import { isFavoriteIssue, type FavoriteIdSets } from "@/lib/favorite-match";
import type { IssueWithRelations } from "@/lib/types";

// Loosely-shaped fixture — only the fields isFavoriteIssue actually reads
// (volume.series.id, volume.series.publisher.id, issue_creators[].creator.id).
// Cast rather than filling every column of the real Issue row type.
function makeIssue(opts: { seriesId?: string; publisherId?: string; creatorIds?: string[] } = {}): IssueWithRelations {
  return {
    volume: {
      series: {
        id: opts.seriesId ?? "series-x",
        publisher: { id: opts.publisherId ?? "publisher-x" },
      },
    },
    issue_creators: (opts.creatorIds ?? []).map((id) => ({ role: "writer", creator: { id } })),
  } as unknown as IssueWithRelations;
}

const none: FavoriteIdSets = { seriesIds: new Set(), publisherIds: new Set(), creatorIds: new Set() };

describe("isFavoriteIssue", () => {
  it("matches a favorited series", () => {
    const favorites: FavoriteIdSets = { ...none, seriesIds: new Set(["series-1"]) };
    expect(isFavoriteIssue(makeIssue({ seriesId: "series-1" }), favorites)).toBe(true);
  });

  it("matches a favorited publisher", () => {
    const favorites: FavoriteIdSets = { ...none, publisherIds: new Set(["pub-1"]) };
    expect(isFavoriteIssue(makeIssue({ publisherId: "pub-1" }), favorites)).toBe(true);
  });

  it("matches a favorited creator credited in any role", () => {
    const favorites: FavoriteIdSets = { ...none, creatorIds: new Set(["creator-1"]) };
    expect(isFavoriteIssue(makeIssue({ creatorIds: ["creator-2", "creator-1"] }), favorites)).toBe(true);
  });

  it("does not match when nothing overlaps", () => {
    const favorites: FavoriteIdSets = {
      seriesIds: new Set(["series-1"]),
      publisherIds: new Set(["pub-1"]),
      creatorIds: new Set(["creator-1"]),
    };
    const issue = makeIssue({ seriesId: "series-2", publisherId: "pub-2", creatorIds: ["creator-2"] });
    expect(isFavoriteIssue(issue, favorites)).toBe(false);
  });

  it("handles an issue with no volume at all", () => {
    const issue = { volume: null, issue_creators: [] } as unknown as IssueWithRelations;
    expect(isFavoriteIssue(issue, { ...none, seriesIds: new Set(["series-1"]) })).toBe(false);
  });
});
