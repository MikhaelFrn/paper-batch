import type { IssueWithRelations } from "./types";

export interface FavoriteIdSets {
  seriesIds: Set<string>;
  publisherIds: Set<string>;
  creatorIds: Set<string>;
}

/** True if an issue belongs to a favorited series or publisher, or has a
 * favorited creator credited on it in any role — the concrete meaning of
 * "this comic matches your favorites." Shared between the Inventory
 * favorites filter and the Favorites page's comics preview so both agree
 * on what counts. */
export function isFavoriteIssue(issue: IssueWithRelations, favorites: FavoriteIdSets): boolean {
  const seriesId = issue.volume?.series?.id;
  const publisherId = issue.volume?.series?.publisher?.id;
  if (seriesId && favorites.seriesIds.has(seriesId)) return true;
  if (publisherId && favorites.publisherIds.has(publisherId)) return true;
  return issue.issue_creators.some(
    (ic) => !!ic.creator?.id && favorites.creatorIds.has(ic.creator.id),
  );
}
