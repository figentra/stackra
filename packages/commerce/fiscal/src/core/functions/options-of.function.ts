/**
 * Stackra file contract:
 * Purpose: `optionsOf(mandate, target)`, the driver options of one call: the unit's own options (`FiscalTarget.options`)
 *          under the market pack's, so the pack carries the market's facts and the host the unit's (ETA's
 *          `activityCode`, Peppol's `accessPointUrl`).
 * Boundary: pure. The pack wins on a key both hold, so a unit never overrides a market fact; a field neither holds is
 *           refused by the driver's own parse (`fiscal_options_invalid`, naming the field). No mandate is no options.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decisions 1 and 2: the pack names the driver and its options); owner decision
 *                     2026-11-09 (market packs hold market facts only).
 */
import type { FiscalMandate } from "#contracts/types/fiscal-mandate.type";
import type { FiscalTarget } from "#contracts/types/fiscal-target.type";

/**
 * The options a driver parses for `target` under `mandate`.
 *
 * @example
 * optionsOf({ options: { submitUrl } }, { market: "eg", channel, unitId, options: { activityCode: "4620" } });
 * // { activityCode: "4620", submitUrl }
 */
export function optionsOf(
  mandate: Pick<FiscalMandate, "options"> | null | undefined,
  target: Pick<FiscalTarget, "options">,
): Readonly<Record<string, unknown>> {
  return { ...target.options, ...mandate?.options };
}
