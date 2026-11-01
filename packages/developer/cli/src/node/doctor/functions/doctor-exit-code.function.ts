/**
 * Stackra file contract:
 * Purpose: `doctorExitCode(results)`, the exit code of a `stackra doctor` run: 1 when a required check fails; a `warn` never fails it (moved from `tools/scripts/doctor.mjs`).
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0027 (CLI tools pinned in mise); ADR 0121 (SDLC tooling roles).
 */
import type { DoctorResult } from "#node/doctor/types/doctor-result.type";

/**
 * 1 when any result failed, else 0.
 *
 * @param results - the checklist.
 * @example
 * doctorExitCode([{ name: "a", status: "warn" }]); // 0
 */
export function doctorExitCode(results: readonly DoctorResult[]): number {
  return results.some((r) => r.status === "fail") ? 1 : 0;
}
