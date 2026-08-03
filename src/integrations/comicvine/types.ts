// Response shapes for the subset of ComicVine fields this app uses.
// Verified against the live API (see field_list usage in client.ts) rather
// than assumed from docs alone.

export interface CvImage {
  icon_url: string;
  medium_url: string;
  screen_url: string;
  screen_large_url: string;
  small_url: string;
  super_url: string;
  thumb_url: string;
  tiny_url: string;
  original_url: string;
}

export interface CvVolumeSummary {
  id: number;
  name: string;
  api_detail_url: string;
}

export interface CvPublisherSummary {
  id: number;
  name: string;
  api_detail_url: string;
}

export interface CvSearchIssue {
  resource_type: "issue";
  id: number;
  name: string | null;
  issue_number: string | null;
  cover_date: string | null;
  store_date: string | null;
  image: CvImage;
  volume: CvVolumeSummary | null;
  api_detail_url: string;
}

export interface CvSearchVolume {
  resource_type: "volume";
  id: number;
  name: string;
  start_year: string | null;
  count_of_issues: number;
  publisher: CvPublisherSummary | null;
  image: CvImage;
  api_detail_url: string;
}

/** Free text, e.g. "penciler, inker, cover" — not a normalized vocabulary. */
export interface CvPersonCredit {
  id: number;
  name: string;
  role: string;
}

export interface CvIssueDetail {
  id: number;
  name: string | null;
  issue_number: string | null;
  cover_date: string | null;
  store_date: string | null;
  image: CvImage;
  volume: CvVolumeSummary | null;
  person_credits: CvPersonCredit[];
}

export interface CvVolumeDetail {
  id: number;
  name: string;
  start_year: string | null;
  publisher: CvPublisherSummary | null;
  image: CvImage;
  count_of_issues: number;
}
