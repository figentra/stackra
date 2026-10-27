/**
 * Stackra file contract:
 * Purpose: `LoyaltyCardPass`, the loyalty card wallet pass (`loyalty_card`): the programme name as title, the points
 *          balance and the tier as fields, the account's public id as serial and QR code, and the brand kit's colours
 *          and logo.
 * Boundary: a pass kind (`Pass({ key })` of @stackra/integrations, ADR 0348 decision 5); it builds content only. The
 *           labels and the tier are lang keys of `assets/lang/<locale>/loyalty_kit.json` (`passes.loyalty_card.*`,
 *           `enums.loyalty_tier.*`), which the host resolves into the issue request's `labels`; the
 *           `WalletPassIssuer` drivers of `@stackra/integrations/node` sign and issue it. Updating issued passes when
 *           the balance changes is not built yet (STA-791).
 * Runtime: node
 * Governing contract: ADR 0348 (decision 5); ADR 0231 (`<module>::<path>` keys); ADR 0454.
 */
import { Pass, type PassContent } from "@stackra/integrations";

import type { LoyaltyCardPassSource } from "#node/integrations/loyalty-card-pass-source.type";

/**
 * The loyalty card pass.
 *
 * @example
 * const content = new LoyaltyCardPass().content({ accountId, programName, tier, balance });
 */
export class LoyaltyCardPass extends Pass({ key: "loyalty_card" }) {
  /** The pass of one account. */
  content(card: LoyaltyCardPassSource): PassContent {
    return {
      serial: card.accountId,
      title: card.programName,
      fields: [
        { label: "loyalty_kit::passes.loyalty_card.points", value: String(card.balance) },
        {
          label: "loyalty_kit::passes.loyalty_card.tier",
          value: `loyalty_kit::enums.loyalty_tier.${card.tier}`,
        },
      ],
      barcode: { format: "qr", value: card.accountId },
      ...(card.brand?.colors === undefined ? {} : { colors: card.brand.colors }),
      ...(card.brand?.logo === undefined ? {} : { logo: card.brand.logo }),
    };
  }
}
