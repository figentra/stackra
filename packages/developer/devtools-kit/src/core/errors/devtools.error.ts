/**
 * Stackra file contract:
 * Purpose: `DevtoolsError`, thrown by the kit and its host session, with a snake_case `code`.
 * Boundary: a plain `Error`, not a refusal: devtools run in development only (ADR 0246), so every failure is a
 *           developer's mistake or a host asking for something that is not there, never a user-facing outcome.
 * Runtime: isomorphic
 * Governing contract: ADR 0246 (decision 1); ADR 0231 (machine codes).
 */
import type { DevtoolsErrorCode } from "#core/types/devtools-error-code.type";

/**
 * A failed devtools call.
 *
 * @example
 * try {
 *   await session.readTab("router.tree");
 * } catch (error) {
 *   if (error instanceof DevtoolsError && error.code === "unknown_tab") showMissing();
 * }
 */
export class DevtoolsError extends Error {
  /** Why it failed. */
  readonly code: DevtoolsErrorCode;

  /**
   * @param code - why it failed.
   * @param message - what failed, naming the tab, RPC, channel or host.
   */
  constructor(code: DevtoolsErrorCode, message: string) {
    super(message);
    this.name = "DevtoolsError";
    this.code = code;
  }
}
