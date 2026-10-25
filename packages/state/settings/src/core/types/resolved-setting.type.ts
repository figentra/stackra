/**
 * Stackra file contract:
 * Purpose: `ResolvedSetting`, one key of a page as `SettingsResolver#resolve` gives it to the admin: the effective
 *          value and its provenance (default, a holder, or a legal floor), its floor and lock, and whether it is
 *          live-editable and essential.
 * Boundary: a type only. `holder` names the holder whose value applies (`SettingLayer["holder"]`) and is `null` for a
 *           default or a floor. A floor is reported whether or not it lifted the value, so the form can show the
 *           bound; `source` is `floor` only when it lifted.
 * Runtime: isomorphic
 * Governing contract: ADR 0213 (decision 2: provenance); ADR 0359 (decisions 1 and 5); config-model section 3.
 */
import type { SettingFloor, SettingSource, SettingValue } from "#contracts/index";

/**
 * One resolved key.
 *
 * @example
 * const { refundWindowDays } = await resolver.resolve(SettingsPages.orders, { scope });
 * if (refundWindowDays.source === SettingSource.Floor) showLaw(refundWindowDays.floor);
 */
export interface ResolvedSetting {
  /** The effective value. */
  readonly value: SettingValue;

  /** Where it comes from. */
  readonly source: SettingSource;

  /** The holder whose stored value applies; `null` for a default or a floor. */
  readonly holder: string | null;

  /** The legal floor on it, if its market sets one. */
  readonly floor: SettingFloor | null;

  /** Whether a holder in the chain locks it. */
  readonly locked: boolean;

  /** Whether it is edited in place on live. */
  readonly live: boolean;

  /** Whether normal mode shows it. */
  readonly essential: boolean;
}
