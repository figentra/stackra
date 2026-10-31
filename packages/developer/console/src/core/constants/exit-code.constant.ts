/**
 * Stackra file contract:
 * Purpose: `EXIT_CODE`, the exit codes the kernel returns besides the handler's own: success, failure, usage, and
 *          the shell's codes for SIGINT and SIGTERM.
 * Boundary: numbers only; the node binding is the only code that sets `process.exitCode`.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-012; spec 030 Requirement 4.
 */

/** The kernel's exit codes. */
export const EXIT_CODE = Object.freeze({
  /** The handler finished. */
  success: 0,
  /** The handler threw, or the container failed to start or close. */
  failure: 1,
  /** The invocation is wrong. */
  usage: 2,
  /** SIGINT, or a cancelled prompt. */
  interrupted: 130,
  /** SIGTERM. */
  terminated: 143,
});
