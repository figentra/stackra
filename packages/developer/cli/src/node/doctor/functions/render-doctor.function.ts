/**
 * Stackra file contract:
 * Purpose: `renderDoctor(results)`, the `stackra doctor` checklist text: one mark per result, the fix under each failure or warning, then the verdict (moved from `tools/scripts/doctor.mjs`).
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0027 (CLI tools pinned in mise); ADR 0121 (SDLC tooling roles).
 */
import type { DoctorResult } from "#node/doctor/types/doctor-result.type";

/**
 * The checklist as printed.
 *
 * @param results - the checklist.
 * @example
 * renderDoctor([{ name: "a", status: "ok" }]); // "✔ a\n\nAll required checks pass."
 */
export function renderDoctor(results: readonly DoctorResult[]): string {
  const mark = { ok: "✔", fail: "✖", warn: "!" };
  const lines = results.map((r) => {
    const head = `${mark[r.status]} ${r.name}${r.detail ? ` — ${r.detail}` : ""}`;
    return r.status === "ok" || !r.fix ? head : `${head}\n    fix: ${r.fix}`;
  });
  const bad = results.filter((r) => r.status === "fail").length;
  lines.push(
    "",
    bad
      ? `${bad} check(s) failing — fix the items above, then re-run pnpm doctor.`
      : "All required checks pass.",
  );
  return lines.join("\n");
}
