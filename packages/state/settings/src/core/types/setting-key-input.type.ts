/**
 * Stackra file contract:
 * Purpose: `SettingKeyInput`, the metadata gen writes for one setting key in a member's `#stackra/settings`: its type,
 *          default, levels, label and help keys, bounds, nullability, lock, approval, client, live and essential flags,
 *          the market-pack key that floors it, its section and its earlier names.
 * Boundary: a type only, data gen derives from the settings classes and the consumed manifests; authored code never
 *           writes it. The label and help are the declaring module's `<module>::settings.<path>.label|help` keys.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 22 to 24); ADR 0294 (decision 20: derived labels); registry v3.1 section 5
 *                     (gen emits `settings`).
 */
import type { I18nKey } from "@stackra/i18n";

import type { SettingValue } from "#contracts/index";
import type { SettingType } from "#core/enums/setting-type.enum";
import type { SettingLevel } from "#core/types/setting-level.type";

/** The metadata of one setting key. */
export interface SettingKeyInput {
  /** What the key holds. */
  readonly type: SettingType;

  /** The value wherever no holder stores one. */
  readonly default: SettingValue;

  /** The levels it may be held at, outermost first. */
  readonly scopes: readonly SettingLevel[];

  /** The field's label. */
  readonly label: I18nKey;

  /** The field's help text. */
  readonly help?: I18nKey;

  /** The smallest number allowed. */
  readonly min?: number;

  /** The largest number allowed. */
  readonly max?: number;

  /** Whether `null` is a value. */
  readonly nullable?: boolean;

  /** Whether a holder may lock it for every holder below. */
  readonly lockable?: boolean;

  /** Whether a change waits for a second approver. */
  readonly approval?: boolean;

  /** Whether clients receive it in the area bootstrap. */
  readonly client?: boolean;

  /** Whether it is edited in place on live (an operational value); otherwise only by promotion. */
  readonly live?: boolean;

  /** Whether normal mode shows it. */
  readonly essential?: boolean;

  /** The market-pack key whose legal floor bounds it. */
  readonly floor?: string;

  /** The section field that holds it, when it belongs to a section. */
  readonly section?: string;

  /** Its earlier paths in the group, newest first. */
  readonly renamed?: readonly string[];
}
