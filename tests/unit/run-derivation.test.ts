import { describe, expect, it } from "vitest";
import { deriveRunSegments, type RunDerivationIssueInput } from "@/lib/run-derivation";

function issues(writerKeys: Array<string | null>): RunDerivationIssueInput[] {
  return writerKeys.map((writerKey, i) => ({ issueId: `i${i + 1}`, writerKey }));
}

describe("deriveRunSegments", () => {
  it("treats a whole volume by one writer as a single verified run", () => {
    const segments = deriveRunSegments(issues(Array(10).fill("A")), { isOngoing: false });
    expect(segments).toEqual([
      { writerKey: "A", issueIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => `i${n}`), status: "verified", confidence: 1 },
    ]);
  });

  it("doesn't let a missing writer credit break continuity", () => {
    // A, then an uncredited issue, then A again — should stay one run, not
    // fracture around the gap in data.
    const segments = deriveRunSegments(issues(["A", null, "A"]), { isOngoing: false });
    expect(segments).toEqual([
      { writerKey: "A", issueIds: ["i1", "i2", "i3"], status: "verified", confidence: 1 },
    ]);
  });

  it("absorbs a single fill-in issue as noise rather than splitting the run", () => {
    // 1 issue by B sandwiched in 40 by A: ratio 1/40 = 0.025, well under the
    // 0.1 noise threshold — should merge away entirely, not create a
    // separate "B" run.
    const segments = deriveRunSegments(
      issues([...Array(20).fill("A"), "B", ...Array(20).fill("A")]),
      { isOngoing: false },
    );
    expect(segments).toHaveLength(1);
    expect(segments[0].writerKey).toBe("A");
    expect(segments[0].issueIds).toHaveLength(41);
    expect(segments[0].status).toBe("verified");
  });

  it("keeps two genuine successive writers as separate verified runs", () => {
    // No return to A afterward — a real, permanent handoff, not a fill-in.
    const segments = deriveRunSegments(
      issues([...Array(15).fill("A"), ...Array(15).fill("B")]),
      { isOngoing: false },
    );
    expect(segments).toEqual([
      { writerKey: "A", issueIds: Array.from({ length: 15 }, (_, i) => `i${i + 1}`), status: "verified", confidence: 1 },
      { writerKey: "B", issueIds: Array.from({ length: 15 }, (_, i) => `i${i + 16}`), status: "verified", confidence: 1 },
    ]);
  });

  it("forces only the truly-last segment to draft when the volume is ongoing", () => {
    const segments = deriveRunSegments(
      issues([...Array(15).fill("A"), ...Array(15).fill("B")]),
      { isOngoing: true },
    );
    expect(segments[0]).toMatchObject({ writerKey: "A", status: "verified", confidence: 1 });
    expect(segments[1]).toMatchObject({ writerKey: "B", status: "draft", confidence: 0.6 });
  });

  it("bridges a real (too-big-for-noise) interruption when the same writer resumes", () => {
    // 15 issues by B (ratio 15/20 = 0.75) is too big to call noise, but A
    // comes right back after — one gap-merged "A" run (draft, since
    // identity-across-a-gap is a claim, not certainty) plus B's own
    // interrupting run, confidently split since its own ratio clears 0.25
    // and it's long enough to auto-verify.
    const segments = deriveRunSegments(
      issues([...Array(10).fill("A"), ...Array(15).fill("B"), ...Array(10).fill("A")]),
      { isOngoing: false },
    );
    expect(segments).toHaveLength(2);
    const [merged, interior] = segments;
    expect(merged.writerKey).toBe("A");
    expect(merged.issueIds).toHaveLength(20);
    expect(merged.status).toBe("draft");
    expect(merged.confidence).toBe(0.5);
    expect(interior.writerKey).toBe("B");
    expect(interior.issueIds).toHaveLength(15);
    expect(interior.status).toBe("verified");
    expect(interior.confidence).toBe(0.85);
  });

  it("treats a true anthology (writer churning almost every issue) as one unreviewed block", () => {
    const segments = deriveRunSegments(issues(["A", "B", "C", "D"]), { isOngoing: false });
    expect(segments).toEqual([
      { writerKey: null, issueIds: ["i1", "i2", "i3", "i4"], status: "draft", confidence: 0.4 },
    ]);
  });

  it("returns nothing for an empty sequence", () => {
    expect(deriveRunSegments([], { isOngoing: false })).toEqual([]);
  });
});
