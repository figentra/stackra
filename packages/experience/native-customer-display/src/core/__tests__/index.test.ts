/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: the `external` driver the generated native wiring imports, and
 *          nothing else; it implements @stackra/peripherals' `CustomerDisplay` port unchanged.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias with no Expo modules registry present,
 *           so an eager native lookup would break the test.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 15); ADR 0478 (decision 5).
 */
import { CustomerDisplay } from "@stackra/peripherals/contracts";
import { describe, expect, it } from "@stackra/testing";

import * as entry from "#core/index";

describe("@stackra/native-customer-display", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(entry).sort()).toEqual(["ExternalCustomerDisplayDriver"]);
  });

  it("implements the CustomerDisplay port", () => {
    expect(new entry.ExternalCustomerDisplayDriver()).toBeInstanceOf(CustomerDisplay);
  });
});
