/**
 * Stackra file contract:
 * Purpose: `FiscalTarget`, where a document is sealed: the market whose pack applies, the channel, and the unit (a
 *          till or an invoicing unit) whose credential signs and whose hash chain it joins.
 * Boundary: a type only; the host knows the market of the legal entity and the unit that issued the document.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decisions 2 and 3).
 */
import type { FiscalChannel } from "#contracts/enums/fiscal-channel.enum";

/** One unit's chain in one market and channel. */
export type FiscalTarget = {
  /** The market-pack code (`sa`, `eu-de`). */
  readonly market: string;
  /** Invoice or till. */
  readonly channel: FiscalChannel;
  /** The till or invoicing unit; one hash chain and one credential per unit. */
  readonly unitId: string;
  /**
   * The unit's own driver options, which no market pack can hold: ETA's `activityCode` (the issuer's registered
   * activity), Peppol's `accessPointUrl` (the tenant's own provider). Merged under the pack's options, so a key the
   * pack holds always keeps the pack's value and a unit never redirects a market fact (`submitUrl`).
   */
  readonly options?: Readonly<Record<string, unknown>>;
};
