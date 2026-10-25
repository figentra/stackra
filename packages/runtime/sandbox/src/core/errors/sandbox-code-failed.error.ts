/**
 * Stackra file contract:
 * Purpose: `SandboxCodeFailedError`, the refusal of `Sandbox.run` when the tenant's code did not compile, threw, or
 *          returned a value that is not JSON (`sandbox_code_failed`).
 * Boundary: kind `FailedPrecondition` (HTTP 412), not retryable: the same code fails the same way. Its details are the
 *           code's own error text, the lines it logged and how long it ran (to meter); they hold only what the
 *           tenant's code produced, never host internals.
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (envelope and kinds); ADR 0154 (decisions 7 and 8); final review R-02 (typed `create`).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * Not retryable: the code is wrong, not the platform.
 *
 * @example
 * throw SandboxCodeFailedError.create({ failure: "TypeError: x is undefined", logs: [], codeMs: 12 });
 */
export class SandboxCodeFailedError extends Refusal({
  kind: ErrorKind.FailedPrecondition,
  retryable: false,
}) {
  /** The code's error as `Name: message`. */
  failure!: string;

  /** Each `console.log` line before it failed. */
  logs!: readonly string[];

  /** The run's wall time in whole milliseconds. */
  codeMs!: number;
}
