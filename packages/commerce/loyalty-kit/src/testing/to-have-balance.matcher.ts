/**
 * Stackra file contract:
 * Purpose: `toHaveBalance`, `await expect(ledger).toHaveBalance(member, points)`: a domain matcher over the
 *          `LoyaltyLedger` port.
 * Boundary: a matcher owned by the package whose port it reads (ADR 0269), exported from `@stackra/loyalty-kit/testing`
 *           and registered with `expect` when the module loads. Async, so it is always awaited.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); ADR 0269 (domain matchers live in the owning package's ./testing).
 */
import { createMatcher } from "@stackra/testing";

import type { LoyaltyLedger } from "#contracts/ports/loyalty-ledger.port";
import type { MemberId } from "#contracts/types/member-id.type";

/**
 * Passes when the ledger's balance for `member` equals `points`; the message names both numbers.
 *
 * @example
 * await expect(ledger).toHaveBalance(memberId("usr_1"), 700);
 */
export const toHaveBalance = createMatcher(
  "toHaveBalance",
  async (ledger: LoyaltyLedger, member: MemberId, points: number) => {
    const actual = await ledger.balance(member);
    return {
      pass: actual === points,
      message: () => `expected ${member} to have ${points} points, found ${actual}`,
    };
  },
);

declare module "@stackra/testing" {
  interface Matchers<R> {
    /** Asserts the ledger balance of one member. */
    toHaveBalance(member: MemberId, points: number): Promise<R>;
  }
}
