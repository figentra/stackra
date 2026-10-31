/**
 * Stackra file contract:
 * Purpose: `specApprovedAt(text, stage)`, who approved a spec at `stage` and when: an `Approved by <who> <YYYY-MM-DD>`
 *          on the `**Status**` line while the spec sits at that stage, or on the `## Status history` line that moved it
 *          there.
 * Boundary: pure; `undefined` when no approval is recorded for the stage.
 * Runtime: node
 * Governing contract: ADR 0502 (spec tiers and approval stops); ADR 0120; ADR 0362. Loaded by plain Node from source
 *                     by core's `tools/scripts` wrappers, so it imports values by relative `.ts` paths and uses
 *                     erasable TypeScript only (ADR 0421 decision 2).
 */
import { specStatusLine } from "./spec-status-line.function.ts";
import { specStatusOf } from "./spec-status-of.function.ts";
import { specStrip } from "./spec-strip.function.ts";

/** `Approved by <who> <date>` in a line. */
const APPROVED = /Approved by ([^\n]+?) (\d{4}-\d{2}-\d{2})\b/;

/**
 * The approval recorded for `stage`.
 *
 * @param text - the spec.md text.
 * @param stage - a lower-cased stage (`clarified`, `planned`).
 * @example
 * specApprovedAt("**Status**: Planned — Approved by owner 2026-10-31", "planned"); // { who: "owner", date: "2026-10-31" }
 */
export function specApprovedAt(
  text: string,
  stage: string,
): { who: string; date: string } | undefined {
  const lines = specStatusOf(text) === stage ? [specStatusLine(text)] : [];
  const history =
    /^## Status history\b[^\n]*\n([\s\S]*?)(?=^## |(?![\s\S]))/m.exec(specStrip(text))?.[1] ?? "";
  lines.push(
    ...history.split("\n").filter((line) => new RegExp(`→\\s*${stage}\\b`, "i").test(line)),
  );
  for (const line of lines) {
    const found = APPROVED.exec(line);
    if (found) return { who: found[1] ?? "", date: found[2] ?? "" };
  }
  return undefined;
}
