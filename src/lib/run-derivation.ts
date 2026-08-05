// Writer-segmentation run derivation. See docs/comicvine-and-runs.md for
// the design reasoning — this is the concrete implementation of it.
//
// Pure, synchronous, no I/O — takes an already-fetched, date-ordered issue
// sequence for one volume and returns candidate run segments. Callers are
// responsible for fetching data and persisting the result.

// Tunable thresholds. Anchor points from design discussion: 5 issues by a
// different writer inside a 523-issue stretch is obviously noise (~1%); 15
// inside a 30-issue stretch is obviously a real split (50%). These two
// concrete numbers are a starting point for the boundary between them —
// adjust once real output has been checked against known runs.
const NOISE_MERGE_RATIO = 0.1;
const CONFIDENT_SPLIT_RATIO = 0.25;
// Rough average length of many real creative runs. A floor only for
// segments that came from resolving a writer-change boundary — a
// homogeneous single-writer run of any length skips this entirely (see
// isWholeVolume below).
const MIN_ISSUES_FOR_AUTO_VERIFY = 12;
// Below this average issues-per-segment, writer identity isn't producing a
// meaningful split at all (e.g. an anthology one-shot where every issue has
// a different writer) — segmenting by writer would just create a pile of
// one-issue "runs" that don't mean anything. Anchor: a 4-issue anthology
// with 4 different writers averages 1.0; a real short arc followed by a
// handoff (e.g. two 2-issue stretches) averages 2.0 and should stay split.
const ANTHOLOGY_AVG_SEGMENT_LENGTH = 1.5;

export interface RunDerivationIssueInput {
  issueId: string;
  /** Primary writer identifier (e.g. creator id) for this issue, or null if
   * uncredited/unknown. Order matters — pass issues sorted oldest first. */
  writerKey: string | null;
}

export interface RunDerivationSegment {
  writerKey: string | null;
  issueIds: string[];
  status: "draft" | "verified";
  confidence: number;
}

interface InternalSegment {
  writerKey: string | null;
  issueIds: string[];
  /** Set only for interior segments evaluated as a candidate interruption
   * and not merged away — the ratio at that decision point. Absent means
   * "never evaluated this way" (the volume's first/last stretch, or a
   * fully homogeneous volume), which defaults to confident. */
  interruptionRatio?: number;
  /** True for a segment produced by bridging a gap (see
   * mergeReturningWriterGaps) — two stretches by the same writer joined
   * across an interruption that was too big to call noise. Always forced
   * to draft: unlike a normal boundary, "same writer resumed" is a claim
   * about identity across a real gap, not just where one continuous
   * stretch ends — a big enough gap (e.g. a whole unrelated multi-year era
   * between the two stretches) means it's probably a new stint, not the
   * same run continuing, and that's not something issue counts alone can
   * tell apart from a short interruption. */
  fromGapMerge?: boolean;
}

function runLengthEncode(issues: RunDerivationIssueInput[]): InternalSegment[] {
  const segments: InternalSegment[] = [];
  for (const issue of issues) {
    const last = segments[segments.length - 1];
    // A missing writer credit never breaks continuity — it's a data gap,
    // not a signal — so it joins whatever segment is already open.
    if (last && (issue.writerKey === null || issue.writerKey === last.writerKey)) {
      last.issueIds.push(issue.issueId);
      continue;
    }
    segments.push({ writerKey: issue.writerKey, issueIds: [issue.issueId] });
  }
  return segments;
}

function coalesceAdjacent(segments: InternalSegment[]): InternalSegment[] {
  const result: InternalSegment[] = [];
  for (const seg of segments) {
    const last = result[result.length - 1];
    if (last && last.writerKey === seg.writerKey) {
      last.issueIds.push(...seg.issueIds);
    } else {
      result.push({ ...seg, issueIds: [...seg.issueIds] });
    }
  }
  return result;
}

/** Repeatedly absorbs any interior segment that's small relative to the
 * same-writer stretch it interrupts back into that stretch (a fill-in
 * issue shouldn't fracture an otherwise-continuous run), and tags
 * surviving interior segments with the ratio that kept them separate. */
function mergeNoise(segments: InternalSegment[]): InternalSegment[] {
  let current = segments.map((s) => ({ ...s, issueIds: [...s.issueIds] }));
  for (;;) {
    let mergedAny = false;
    const next: InternalSegment[] = [];
    for (let i = 0; i < current.length; i++) {
      const seg = current[i];
      const prevOriginal = current[i - 1];
      const afterOriginal = current[i + 1];
      const isInterior = i > 0 && i < current.length - 1;
      const isSandwiched =
        isInterior &&
        !!prevOriginal &&
        !!afterOriginal &&
        prevOriginal.writerKey === afterOriginal.writerKey &&
        seg.writerKey !== prevOriginal.writerKey;

      if (isSandwiched) {
        const surrounding = prevOriginal.issueIds.length + afterOriginal.issueIds.length;
        const ratio = seg.issueIds.length / surrounding;
        if (ratio < NOISE_MERGE_RATIO) {
          const prevInNext = next[next.length - 1];
          if (prevInNext) {
            prevInNext.issueIds.push(...seg.issueIds);
            mergedAny = true;
            continue;
          }
        }
        next.push({ ...seg, issueIds: [...seg.issueIds], interruptionRatio: ratio });
        continue;
      }
      next.push({ ...seg, issueIds: [...seg.issueIds] });
    }
    current = coalesceAdjacent(next);
    if (!mergedAny) return current;
  }
}

/** Handles the case `mergeNoise` deliberately leaves alone: an interruption
 * too big to call noise (e.g. a 2-issue fill-in arc inside a 6-issue
 * volume), where the original writer resumes right after it. That's still
 * one creative run, not two — the fill-in belongs in its own run, but the
 * writer's two flanking stretches should end up as a single run record
 * with a gap, not separate ones. Deliberately narrow: only merges segments
 * immediately sandwiching a single interruption, never a writer's earlier
 * stint reappearing much later after long, unrelated stretches by other
 * writers — that's a new stint, not the same run continuing. */
function mergeReturningWriterGaps(segments: InternalSegment[]): InternalSegment[] {
  let current = segments.map((s) => ({ ...s, issueIds: [...s.issueIds] }));
  for (;;) {
    let mergedIndex = -1;
    for (let i = 1; i < current.length - 1; i++) {
      const prev = current[i - 1];
      const interior = current[i];
      const after = current[i + 1];
      if (
        prev.writerKey !== null &&
        prev.writerKey === after.writerKey &&
        interior.writerKey !== prev.writerKey
      ) {
        mergedIndex = i;
        break;
      }
    }
    if (mergedIndex === -1) return current;

    const prev = current[mergedIndex - 1];
    const interior = current[mergedIndex];
    const after = current[mergedIndex + 1];
    const combined: InternalSegment = {
      writerKey: prev.writerKey,
      issueIds: [...prev.issueIds, ...after.issueIds],
      fromGapMerge: true,
    };
    current = [
      ...current.slice(0, mergedIndex - 1),
      combined,
      interior,
      ...current.slice(mergedIndex + 2),
    ];
  }
}

export interface RunDerivationOptions {
  /** True if the volume might still receive new issues — the final
   * segment's classification could still be revised by future data, so
   * it's always forced to draft regardless of how clean it looks now. */
  isOngoing: boolean;
}

export function deriveRunSegments(
  issues: RunDerivationIssueInput[],
  options: RunDerivationOptions,
): RunDerivationSegment[] {
  if (issues.length === 0) return [];

  const merged = mergeReturningWriterGaps(mergeNoise(runLengthEncode(issues)));
  const isWholeVolume = merged.length === 1;

  if (!isWholeVolume) {
    const avgSegmentLength = issues.length / merged.length;
    if (avgSegmentLength <= ANTHOLOGY_AVG_SEGMENT_LENGTH) {
      // Writer identity churns almost every issue — there's no coherent
      // writer-based split to make. Treat it as one anthology block rather
      // than a pile of one-issue "runs"; low confidence flags it as
      // unreviewed rather than claiming a real single-writer run.
      return [
        {
          writerKey: null,
          issueIds: issues.map((i) => i.issueId),
          status: "draft",
          confidence: 0.4,
        },
      ];
    }
  }

  return merged.map((seg, index): RunDerivationSegment => {
    const isLast = index === merged.length - 1;

    if (isLast && options.isOngoing) {
      return { writerKey: seg.writerKey, issueIds: seg.issueIds, status: "draft", confidence: 0.6 };
    }
    if (isWholeVolume) {
      return { writerKey: seg.writerKey, issueIds: seg.issueIds, status: "verified", confidence: 1 };
    }
    if (seg.fromGapMerge) {
      return { writerKey: seg.writerKey, issueIds: seg.issueIds, status: "draft", confidence: 0.5 };
    }
    if (seg.issueIds.length < MIN_ISSUES_FOR_AUTO_VERIFY) {
      return { writerKey: seg.writerKey, issueIds: seg.issueIds, status: "draft", confidence: 0.5 };
    }
    // No interruptionRatio means this segment was never a candidate
    // interruption at all (it's an anchoring first/last stretch, or sits
    // between two differently-written neighbors) — its own legitimacy was
    // never in question, so it's as certain as the whole-volume case.
    if (seg.interruptionRatio === undefined) {
      return { writerKey: seg.writerKey, issueIds: seg.issueIds, status: "verified", confidence: 1 };
    }
    const confident = seg.interruptionRatio >= CONFIDENT_SPLIT_RATIO;
    return {
      writerKey: seg.writerKey,
      issueIds: seg.issueIds,
      status: confident ? "verified" : "draft",
      confidence: confident ? 0.85 : 0.55,
    };
  });
}
