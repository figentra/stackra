/**
 * Stackra file contract:
 * Purpose: `restoreAfterTest(restore)`: runs `restore` when the current test finishes, so a frozen clock or id source
 *          never leaks into the next test; hands `restore` back for callers outside a test.
 * Boundary: internal to the kit (not exported from `.`); used by `freezeClock` and `freezeIds`, and by the `./react`
 *           and `./native` renders for their cleanup (an async `restore` is awaited by vitest).
 * Runtime: node
 * Governing contract: ADR 0269 (decision 2); ADR 0294 (rule R7: functions are never classes).
 */
import { onTestFinished } from "vitest";

/**
 * Inside a test or a `beforeEach` hook, registers `restore` to run when that test finishes. In a `beforeAll` hook or
 * at module scope there is no current test, so nothing is registered: the state holds for the rest of the file and
 * the caller may run the returned function itself (for example in `afterAll`).
 *
 * @param restore - undoes what the caller installed; safe to run more than once.
 * @returns `restore`, unchanged.
 */
export function restoreAfterTest(restore: () => void): () => void {
  try {
    onTestFinished(() => restore());
  } catch {
    // No current test (beforeAll or module scope): vitest refuses the hook, and the state lasts for the file.
  }
  return restore;
}
