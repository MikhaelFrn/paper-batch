import { describe, expect, it } from "vitest";
import {
  computeRangeTouchesLatest,
  filterIssuesByRange,
  issueDateKey,
  parseIssueNumberForRange,
} from "@/services/runs";

describe("issueDateKey", () => {
  it("prefers store_date over cover_date", () => {
    expect(issueDateKey({ store_date: "2020-01-01", cover_date: "2020-03-01" })).toBe("2020-01-01");
  });

  it("falls back to cover_date when store_date is missing", () => {
    expect(issueDateKey({ store_date: null, cover_date: "2020-03-01" })).toBe("2020-03-01");
  });

  it("returns an empty string when both are missing", () => {
    expect(issueDateKey({ store_date: null, cover_date: null })).toBe("");
  });
});

describe("parseIssueNumberForRange", () => {
  it("parses a plain issue number", () => {
    expect(parseIssueNumberForRange("12")).toBe(12);
  });

  it("parses a decimal issue number", () => {
    expect(parseIssueNumberForRange("0.5")).toBe(0.5);
  });

  it("returns null for a non-numeric variant like '1AU'", () => {
    expect(parseIssueNumberForRange("1AU")).toBeNull();
  });

  it("returns null for a missing issue number", () => {
    expect(parseIssueNumberForRange(null)).toBeNull();
  });
});

function issue(n: string, date: string) {
  return { issue_number: n, store_date: date, cover_date: null as string | null };
}

describe("filterIssuesByRange", () => {
  const all = [issue("1", "2020-01-01"), issue("2", "2020-02-01"), issue("3", "2020-03-01"), issue("4", "2020-04-01")];

  it("returns everything unchanged when there's no range", () => {
    expect(filterIssuesByRange(all, undefined)).toBe(all);
  });

  it("keeps only issues inside an inclusive range", () => {
    expect(filterIssuesByRange(all, { from: 2, to: 3 }).map((i) => i.issue_number)).toEqual(["2", "3"]);
  });

  it("normalizes a reversed from/to", () => {
    expect(filterIssuesByRange(all, { from: 3, to: 2 }).map((i) => i.issue_number)).toEqual(["2", "3"]);
  });

  it("returns nothing for a range outside every issue number", () => {
    expect(filterIssuesByRange(all, { from: 100, to: 200 })).toEqual([]);
  });

  it("excludes issues whose number doesn't parse, in a ranged pass", () => {
    const withVariant = [...all, issue("2AU", "2020-02-15")];
    expect(filterIssuesByRange(withVariant, { from: 1, to: 4 }).map((i) => i.issue_number)).toEqual([
      "1",
      "2",
      "3",
      "4",
    ]);
  });
});

describe("computeRangeTouchesLatest", () => {
  const all = [issue("1", "2020-01-01"), issue("2", "2020-02-01"), issue("3", "2020-03-01"), issue("4", "2020-04-01")];

  it("is always true when there's no range at all", () => {
    expect(computeRangeTouchesLatest([], [], false)).toBe(true);
  });

  it("is true for a whole-volume pass", () => {
    expect(computeRangeTouchesLatest(all, all, true)).toBe(true);
  });

  it("is true when the ranged slice includes the volume's actual newest issue", () => {
    const range = filterIssuesByRange(all, { from: 3, to: 4 });
    expect(computeRangeTouchesLatest(all, range, true)).toBe(true);
  });

  it("is false for an early chunk that doesn't reach the newest issue", () => {
    const range = filterIssuesByRange(all, { from: 1, to: 2 });
    expect(computeRangeTouchesLatest(all, range, true)).toBe(false);
  });

  it("is false when the volume has no issues at all (no latest to touch)", () => {
    expect(computeRangeTouchesLatest([], [], true)).toBe(false);
  });
});
