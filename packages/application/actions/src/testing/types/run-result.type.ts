/**
 * Stackra file contract:
 * Purpose: `RunResult<O>`, what `run(...)` resolves to: whether the call succeeded, its output, its refusal and the
 *          events the app published during it.
 * Boundary: a type only. A refused call resolves (never rejects), so a test asserts with `toRefuseWith`; reading
 *           `output` of a refused call throws its refusal, so a happy-path test fails with the real reason. A bug (any
 *           non-refusal error) rejects `run` itself. `events` is what `toRecord` reads; `audit` is what `toHaveAudited` reads.
 * Runtime: node
 * Governing contract: ADR 0269 (testing helpers); ADR 0140 (refusals).
 */
import type { Refusal } from "@stackra/errors";

import type { AuditEntry } from "#contracts/index";

/** The outcome of one call run in a test. */
export interface RunResult<O> {
  /** `true` when the call returned an output, `false` when it was refused. */
  readonly ok: boolean;

  /** The call's output; reading it on a refused call throws the refusal. */
  readonly output: O;

  /** The refusal of a refused call; `undefined` when `ok`. */
  readonly error: Refusal | undefined;

  /** The events the testing app published during the call, oldest first. */
  readonly events: readonly object[];

  /** The call's audit entry (what `toHaveAudited` reads); `undefined` for a query, which is never audited. */
  readonly audit: AuditEntry | undefined;
}
