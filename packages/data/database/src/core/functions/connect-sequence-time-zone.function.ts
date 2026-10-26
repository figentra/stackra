/**
 * Stackra file contract:
 * Purpose: `connectSequenceTimeZone`, which names the `SequenceTimeZone` driver every yearly series reads its period's
 *          time zone from; gen's boot calls it once with the bound driver, the testing module on every compile.
 * Boundary: replaces the previous driver whole; `undefined` disconnects, and then the call's own time zone governs.
 * Runtime: node
 * Governing contract: ADR 0394 (decision 1); the `connectHoldRegistry` precedent.
 */
import { SEQUENCE_TIME_ZONE_HOST } from "#core/constants/sequence-time-zone-host.constant";
import type { SequenceTimeZone } from "#contracts/ports/sequence-time-zone.port";

/**
 * Connects the yearly series to their owners' time zone setting.
 *
 * @param source - the bound `SequenceTimeZone` driver, or `undefined` to disconnect.
 * @example
 * connectSequenceTimeZone(container.has(SequenceTimeZone) ? container.get(SequenceTimeZone) : undefined);
 */
export function connectSequenceTimeZone(source: SequenceTimeZone | undefined): void {
  SEQUENCE_TIME_ZONE_HOST.source = source;
}
