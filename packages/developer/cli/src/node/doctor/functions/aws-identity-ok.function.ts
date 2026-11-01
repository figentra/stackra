/**
 * Stackra file contract:
 * Purpose: `awsIdentityOk(status, stdout)`, whether `aws sts get-caller-identity` succeeded and returned an Account; the value itself is never shown (moved from `tools/scripts/doctor.mjs`).
 * Boundary: pure; the output is parsed, never printed.
 * Runtime: node
 * Governing contract: ADR 0027 (CLI tools pinned in mise); ADR 0121 (SDLC tooling roles).
 */

/**
 * True when the call exited 0 with an Account.
 *
 * @param status - the exit status.
 * @param stdout - its JSON output.
 * @example
 * awsIdentityOk(0, '{"Account":"123"}'); // true
 */
export function awsIdentityOk(status: number | null, stdout: string): boolean {
  if (status !== 0) return false;
  try {
    return Boolean((JSON.parse(stdout) as { Account?: unknown }).Account);
  } catch {
    return false;
  }
}
