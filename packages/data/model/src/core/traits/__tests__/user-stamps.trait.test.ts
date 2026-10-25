/**
 * Stackra file contract:
 * Purpose: unit tests of `UserStamps`: both principal stamps start as `null` until the unit of work fills them.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0133 (decision 7).
 */
import { describe, expect, it } from "@stackra/testing";

import { Model } from "#core/bases/model.base";
import { UserStamps } from "#core/traits/user-stamps.trait";

class Order extends Model.with(UserStamps) {}

describe("UserStamps", () => {
  it("starts both stamps as null", () => {
    const order = new Order();
    expect(order.createdBy).toBeNull();
    expect(order.updatedBy).toBeNull();
    order.updatedBy = "usr_01jab3k4m5n6p7q8r9s0t1v2w3";
    expect(order.updatedBy).toBe("usr_01jab3k4m5n6p7q8r9s0t1v2w3");
    expect(UserStamps.traitName).toBe("user_stamps");
  });
});
