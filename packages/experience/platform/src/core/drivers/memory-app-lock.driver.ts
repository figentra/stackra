/**
 * Stackra file contract:
 * Purpose: `MemoryAppLockDriver`, the `AppLock` driver of tests and of targets with no device check of their own
 *          (the web, the desktop): the `memory` candidate; a test sets what the phone can do and what the prompt
 *          answers.
 * Boundary: `canAuthenticate` answers `isAvailable` (the passcode fallback changes nothing here); `authenticate`
 *           records each reason and answers `answer`. The constructor takes nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0266 (memory drivers first); ADR 0269 (fakes are real drivers); ADR 0250 (2026-10-29 note).
 */
import { Driver } from "@stackra/container";

import { AppLock } from "#contracts/ports/app-lock.port";

/**
 * The app lock check in memory.
 *
 * @example
 * const lock = new MemoryAppLockDriver();
 * lock.answer = false; // the owner cancels the prompt
 */
export class MemoryAppLockDriver extends Driver(AppLock) {
  /** The reason of each prompt shown, in order. */
  readonly prompts: string[] = [];

  /** Whether the phone can authenticate; a test sets it. */
  isAvailable = true;

  /** What the prompt answers; a test sets it. */
  answer = true;

  /** Answers `isAvailable`. */
  async canAuthenticate(): Promise<boolean> {
    return this.isAvailable;
  }

  /** Records `reason` and answers `answer`. */
  async authenticate(reason: string): Promise<boolean> {
    this.prompts.push(reason);
    return this.answer;
  }
}
