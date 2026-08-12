import { describe, expect, it } from "vitest";
import { normalizeSeriesName as normalizeForImport } from "@/services/comicvine";
import { normalizeSeriesName as normalizeForDuplicateCheck } from "@/lib/comic-adapters";

describe("services/comicvine normalizeSeriesName (series matching/grouping)", () => {
  it("lowercases and strips a leading 'The'", () => {
    expect(normalizeForImport("The Amazing Spider-Man")).toBe("amazing spider man");
  });

  it("groups an annual into its parent series", () => {
    expect(normalizeForImport("Amazing Spider-Man Annual 2020")).toBe("amazing spider man");
  });

  it("groups a special (with issue number) into its parent series", () => {
    expect(normalizeForImport("Batman Special #1")).toBe("batman");
  });

  it("groups a giant-size one-shot into its parent series", () => {
    expect(normalizeForImport("X-Men Giant-Size")).toBe("x men");
  });

  it("does not touch a suffix that isn't preceded by a word", () => {
    // No leading word for the ANNUAL_SUFFIX regex to anchor off of — a
    // volume genuinely just named "Annual" is its own thing, not grouped
    // away into nothing.
    expect(normalizeForImport("Annual")).toBe("annual");
  });

  it("does not strip a mid-name occurrence, only a trailing one", () => {
    expect(normalizeForImport("Giant-Size X-Men")).toBe("giant size x men");
  });
});

describe("lib/comic-adapters normalizeSeriesName (owned-comic duplicate detection)", () => {
  it("lowercases and strips a leading 'The'", () => {
    expect(normalizeForDuplicateCheck("The Amazing Spider-Man")).toBe("amazing spider man");
  });

  it("deliberately does NOT group an annual into its parent series", () => {
    // An annual and a regular issue sharing a number are not the same
    // physical comic — collapsing them here would misfire the "already own
    // something similar?" duplicate warning on the comic detail page.
    expect(normalizeForDuplicateCheck("Amazing Spider-Man Annual 2020")).toBe("amazing spider man annual 2020");
  });
});

describe("the two normalizeSeriesName implementations intentionally diverge on annuals", () => {
  it("agree on a plain series name", () => {
    const name = "The Amazing Spider-Man";
    expect(normalizeForImport(name)).toBe(normalizeForDuplicateCheck(name));
  });

  it("disagree on an annual — regression guard against someone 'helpfully' unifying them", () => {
    const name = "Amazing Spider-Man Annual 2020";
    expect(normalizeForImport(name)).not.toBe(normalizeForDuplicateCheck(name));
  });
});
