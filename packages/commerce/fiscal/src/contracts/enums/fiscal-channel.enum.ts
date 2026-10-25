/**
 * Stackra file contract:
 * Purpose: `FiscalChannel`, which section of a market pack's fiscal data a document is sealed under: the e-invoicing
 *          mandate (`invoice`) or the till fiscal rule (`till`).
 * Boundary: an `Enum.of` value plus the type of the same name, in the leaf entry. The pack, not the code, says which
 *           driver serves each channel in a market. Codes are snake_case.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decisions 1 and 2); ADR 0363 (decision 3); ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/**
 * A B2B or B2C invoice issued by a back office goes through `invoice`; a sale rung up at a till goes through `till`.
 *
 * @example
 * await fiscal.seal(document, { market: "sa", channel: FiscalChannel.Till, unitId: "till_1" });
 */
export const FiscalChannel = Enum.of({
  /** The pack's e-invoicing mandate (clearance, reporting, Peppol, hybrid PDF). */
  Invoice: "invoice",
  /** The pack's till fiscal rule (a signing device, a signed journal, a device certificate). */
  Till: "till",
});

/** One of the codes above. */
export type FiscalChannel = Enum.Value<typeof FiscalChannel>;
