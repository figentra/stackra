/**
 * Stackra file contract:
 * Purpose: the `SequenceTimeZone` port: the IANA time zone in which the year of a yearly sequence is read, per series,
 *          so a document issued at 23:30 on 31 December takes the number of the year its legal entity is in.
 * Boundary: an abstract class that is its own token. The time zone is a setting of the series' owner (a legal entity's
 *           settings group, or the product default), never a value in code: the product that owns the series binds a
 *           driver that reads it. It answers `undefined` when the setting is unset, and `SequenceService` then takes
 *           the call's own time zone. With no driver connected, the call's time zone governs.
 * Runtime: node
 * Governing contract: ADR 0394 (decision 1); ADR 0342 (decision 1: yearly reset); config-model section 3 (values live in
 *                     settings).
 */
import type { ScopeRef } from "@stackra/contracts";
import { Port } from "@stackra/contracts";

/**
 * Answers the time zone of a yearly series.
 *
 * @example
 * export class InvoicingSequenceTimeZoneDriver extends Driver(SequenceTimeZone) {
 *   async timeZoneOf(key: string, scope: ScopeRef, series: Readonly<Record<string, string>>) {
 *     return (await this.settings.get(InvoicingSettings, { scope })).numberingTimeZone;
 *   }
 * }
 */
export abstract class SequenceTimeZone extends Port {
  /**
   * The IANA time zone the period of `key` is read in at `scope` and `series`, or `undefined` when none is set.
   *
   * @param key - the sequence's locked key (`billing.invoice`).
   * @param scope - the scope node the series counts in.
   * @param series - the values of the sequence's declared dimensions, by name.
   */
  abstract timeZoneOf(
    key: string,
    scope: ScopeRef,
    series: Readonly<Record<string, string>>,
  ): Promise<string | undefined>;
}
