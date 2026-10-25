/**
 * Stackra file contract:
 * Purpose: `SandboxLimitExceededError`, the refusal of `Sandbox.run` when the run passed one of its limits: its time,
 *          its memory or its output (`sandbox_limit_exceeded`).
 * Boundary: kind `FailedPrecondition` (HTTP 412), not retryable: the limits come from the tenant's plan and the same run
 *           passes them again. Its details name the limit and how long the run took (to meter).
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (envelope and kinds); ADR 0154 (decisions 6 and 8); final review R-02 (typed `create`).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

import type { SandboxLimit } from "#core/types/sandbox-limit.type";

/**
 * Not retryable: the plan's limit holds until the plan changes.
 *
 * @example
 * throw SandboxLimitExceededError.create({ limit: "time", codeMs: 5000 });
 */
export class SandboxLimitExceededError extends Refusal({
  kind: ErrorKind.FailedPrecondition,
  retryable: false,
}) {
  /** The limit the run passed. */
  limit!: SandboxLimit;

  /** The run's wall time in whole milliseconds. */
  codeMs!: number;
}
