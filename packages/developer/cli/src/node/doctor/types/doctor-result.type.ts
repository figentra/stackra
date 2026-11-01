/**
 * Stackra file contract:
 * Purpose: `DoctorResult`, one line of the `stackra doctor` checklist: what was checked, how it went and how to fix it.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0027 (CLI tools pinned in mise); ADR 0121 (SDLC tooling roles).
 */

/** One checked item. */
export type DoctorResult = {
  /** What was checked. */
  readonly name: string;

  /** `fail` fails the run; `warn` never does. */
  readonly status: "ok" | "fail" | "warn";

  /** What was found, when there is more to say. */
  readonly detail?: string | undefined;

  /** The command or step that fixes it. */
  readonly fix?: string | undefined;
};
