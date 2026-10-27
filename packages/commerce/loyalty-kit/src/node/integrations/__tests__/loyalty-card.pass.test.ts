/**
 * Stackra file contract:
 * Purpose: unit tests of `LoyaltyCardPass`: a `loyalty_card` pass kind whose content carries the account id as serial
 *          and QR code, the balance and the tier as lang-keyed fields, and the brand only when given.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0348 (decision 5).
 */
import { kindOf } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";

import { LoyaltyTier } from "#contracts/enums/loyalty-tier.enum";
import { LoyaltyCardPass } from "#node/integrations/loyalty-card.pass";

const card = {
  accountId: "lac_00000000000000000000000001",
  programName: "Acme Rewards",
  tier: LoyaltyTier.Gold,
  balance: 1250,
};

describe("LoyaltyCardPass", () => {
  it("is the loyalty_card pass kind", () => {
    expect(kindOf(LoyaltyCardPass)).toEqual({ kind: "pass", options: { key: "loyalty_card" } });
  });

  it("builds the card from the account", () => {
    expect(new LoyaltyCardPass().content(card)).toEqual({
      serial: "lac_00000000000000000000000001",
      title: "Acme Rewards",
      fields: [
        { label: "loyalty_kit::passes.loyalty_card.points", value: "1250" },
        {
          label: "loyalty_kit::passes.loyalty_card.tier",
          value: "loyalty_kit::enums.loyalty_tier.gold",
        },
      ],
      barcode: { format: "qr", value: "lac_00000000000000000000000001" },
    });
  });

  it("carries the brand kit's colours and logo", () => {
    const colors = { background: "#000000", foreground: "#ffffff" };
    expect(new LoyaltyCardPass().content({ ...card, brand: { colors } }).colors).toEqual(colors);
  });
});
