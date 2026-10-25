/**
 * Stackra file contract:
 * Purpose: unit tests of `Pass`: a pass kind records its key and builds content from its record; a bad key is refused
 *          when the class is declared.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0348 (decision 5).
 */
import { kindOf } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";

import { Pass } from "#core/bases/pass.base";
import type { PassContent } from "#core/types/pass-content.type";

class LoyaltyCardPass extends Pass({ key: "loyalty_card" }) {
  content(card: { readonly id: string; readonly points: number }): PassContent {
    return {
      serial: card.id,
      title: "Acme Rewards",
      fields: [{ label: "Points", value: String(card.points) }],
    };
  }
}

describe("Pass", () => {
  it("records its key and builds content", async () => {
    expect(kindOf(LoyaltyCardPass)).toEqual({ kind: "pass", options: { key: "loyalty_card" } });
    expect(
      (await new LoyaltyCardPass().content({ id: "lyc_1", points: 120 })).fields[0]?.value,
    ).toBe("120");
  });

  it("refuses a key that is not snake_case", () => {
    expect(() => Pass({ key: "LoyaltyCard" })).toThrow(TypeError);
  });
});
