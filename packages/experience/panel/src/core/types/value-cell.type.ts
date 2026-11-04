/**
 * Stackra file contract:
 * Purpose: `ValueCell`, one resource value as both entries' `ResourceValue` shows it: the resource, the value's path,
 *          its column or entry kind, the value, the currency beside it and the column's own enum labels.
 * Boundary: a type only; the web and native resource values, tables and View pages share it.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 1: wire paths); ADR 0164.
 */
import type { I18nKey } from "@stackra/i18n";

/** One value to show. */
export interface ValueCell {
  /** The resource key whose enum labels the value takes. */
  readonly resourceKey: string;

  /** The value's wire path (`totals.totalMinor`). */
  readonly path: string;

  /** The column or entry kind (`money`, `count`, `value`). */
  readonly kind: string;

  /** The value. */
  readonly value: unknown;

  /** The currency beside a money value. */
  readonly currency?: unknown;

  /** The enum labels the column or entry names, by code. */
  readonly labels?: Readonly<Record<string, I18nKey>> | undefined;
}
