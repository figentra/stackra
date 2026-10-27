/**
 * Stackra file contract:
 * Purpose: the `UsedReceiptStore` port: where exit gates record the receipts that have let someone out, so a receipt
 *          opens one exit of a venue once even when the venue has several exits. `claim` is atomic: exactly one of two
 *          gates claiming one receipt at once gets `true`.
 * Boundary: an abstract class that is its own token, keyed `peripherals.UsedReceiptStore`. Only the `memory` driver
 *           ships (one gate's own memory); a shared driver (the venue's server, a realtime relay) comes with the
 *           venue that needs it. A store that cannot answer refuses with capability `network`, and the gate stays
 *           closed. It stores receipt ids only, never the token or what was bought.
 * Runtime: isomorphic
 * Governing contract: ADR 0429 (decision 3: the shared used-receipt store); ADR 0449 (decision 4); ADR 0250
 *                     (decision 3); ADR 0294 (decisions 4, 15 and 16).
 */
import { Port } from "@stackra/contracts";
import type { CapabilityResult } from "@stackra/platform/contracts";

/**
 * The used receipts of a venue.
 *
 * @example
 * const claimed = await usedReceipts.claim("rct_1", new Date(issuedAt + maxAge));
 * if (claimed.ok && claimed.data) await gate.open();
 */
export abstract class UsedReceiptStore extends Port {
  /** Type-only port key, so `DriverName<UsedReceiptStore>` narrows to this port's drivers. */
  declare readonly "~key": "peripherals.UsedReceiptStore";

  /**
   * Marks `receiptId` used; answers true when this call used it first, false when it was used before. `until` is when
   * the receipt can no longer pass anyway (its token has expired), so a store may forget it from then on.
   */
  abstract claim(receiptId: string, until: Date): Promise<CapabilityResult<boolean>>;

  /** Gives `receiptId` back, for a gate that claimed it and then could not open. */
  abstract release(receiptId: string): Promise<CapabilityResult>;
}
