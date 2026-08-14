import { describe, expect, it } from "vitest";
import { normalizePublisherName } from "@/services/comicvine";

describe("services/comicvine normalizePublisherName", () => {
  it("leaves an already-canonical name untouched", () => {
    expect(normalizePublisherName("Marvel")).toBe("Marvel");
  });

  it("folds a regional variant into the canonical name", () => {
    expect(normalizePublisherName("Marvel UK")).toBe("Marvel");
    expect(normalizePublisherName("DC Comics France")).toBe("DC Comics");
  });

  it("folds a bare abbreviation onto its full canonical name", () => {
    expect(normalizePublisherName("DC")).toBe("DC Comics");
    expect(normalizePublisherName("IDW")).toBe("IDW Publishing");
  });

  it("matches on whole words only, not a substring", () => {
    // "Marvelous Studios" contains "Marvel" as a raw substring but not as
    // its own word — must NOT get folded into "Marvel".
    expect(normalizePublisherName("Marvelous Studios")).toBe("Marvelous Studios");
    expect(normalizePublisherName("Imagenary Comics")).toBe("Imagenary Comics");
  });

  it("leaves an unrelated publisher name untouched", () => {
    expect(normalizePublisherName("Oni Press")).toBe("Oni Press");
  });
});
