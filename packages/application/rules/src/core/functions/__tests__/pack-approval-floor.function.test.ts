/**
 * Stackra file contract:
 * Purpose: unit tests of `packApprovalFloorOf`: no `ai.approval_floor` is no floor; a pack value becomes an
 *          `ApprovalFloor` with its defaults; a value of another shape throws.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0398 (decision 3); STA-1250.
 */
import type { ResolvedValue } from "@stackra/market-packs";
import { describe, expect, it } from "@stackra/testing";

import {
  APPROVAL_FLOOR_KEY,
  packApprovalFloorOf,
} from "#core/functions/pack-approval-floor.function";

/** A resolved pack value at `key`. */
const valueAt = (key: string, value: unknown) =>
  ({ key, value, market: "sa", version: "1.0.0" }) as ResolvedValue;

describe("packApprovalFloorOf", () => {
  it("is undefined when the pack sets no approval floor", () => {
    expect(packApprovalFloorOf([valueAt("consumer.withdrawal_days", 14)])).toBeUndefined();
  });

  it("reads the floor, defaulting the lists and deletes", () => {
    expect(
      packApprovalFloorOf([
        valueAt(APPROVAL_FLOOR_KEY, { actions: ["legal.claim.file@1"], recipientLimit: 50 }),
      ]),
    ).toEqual({
      tags: [],
      tagSets: [],
      deletes: false,
      actions: ["legal.claim.file@1"],
      recipientLimit: 50,
    });
  });

  it("throws on a value that is not a floor", () => {
    expect(() => packApprovalFloorOf([valueAt(APPROVAL_FLOOR_KEY, { tags: "financial" })])).toThrow(
      /ai\.approval_floor of sa 1\.0\.0 is not a floor/,
    );
  });
});
