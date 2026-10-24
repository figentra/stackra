/**
 * Stackra file contract:
 * Purpose: unit and type tests of `NotificationCategory`: its three codes in order, and the case data that says which
 *          category preferences may mute and which needs opt-in.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0223 (category drives channel and consent).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { NotificationCategory } from "#core/enums/notification-category.enum";

describe("NotificationCategory", () => {
  it("lists its codes in source order", () => {
    expect(Enum.values(NotificationCategory)).toEqual(["transactional", "activity", "marketing"]);
    expectTypeOf<NotificationCategory>().toEqualTypeOf<
      "transactional" | "activity" | "marketing"
    >();
  });

  it("never lets preferences mute a transactional notification", () => {
    expect(Enum.meta(NotificationCategory, NotificationCategory.Transactional)).toEqual({
      mutable: false,
      optIn: false,
    });
  });

  it("needs opt-in for marketing only", () => {
    expect(
      Enum.values(NotificationCategory).filter(
        (code) => Enum.meta(NotificationCategory, code).optIn,
      ),
    ).toEqual(["marketing"]);
  });
});
