/**
 * Stackra file contract:
 * Purpose: `CallAssurance`, what the verified credential of a call says about its last authentication: the methods
 *          used (`amr`), when it happened (`auth_time`) and the level those methods reach.
 * Boundary: a type only. The transport fills it from the verified token (never from request input), with the level
 *           that `@stackra/identity`'s `assuranceOf` derives from the configured method map; the pipeline hands it to
 *           `ctx.assurance` and to the `StepUpCheck` port. Absent when the caller has no interactive session (a job,
 *           an API key).
 * Runtime: isomorphic
 * Governing contract: ADR 0207 (decision 1); ADR 0406; STA-814.
 */
import type { AssuranceLevel } from "@stackra/contracts";

/** The verified assurance of one call. */
export interface CallAssurance {
  /** The authentication methods references of the token (`pwd`, `otp`, `hwk`). */
  readonly amr: readonly string[];

  /** When the user last authenticated (the token's `auth_time`); `undefined` when the token does not say. */
  readonly authTime: Date | undefined;

  /** The strongest level the methods reach; `undefined` when none is mapped. */
  readonly level: AssuranceLevel | undefined;
}
