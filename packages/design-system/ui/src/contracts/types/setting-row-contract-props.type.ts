/**
 * Stackra file contract:
 * Purpose: the props every runtime's `SettingRow` takes: the title, the description, an icon, the switch's value and
 *          handler, the trailing action that stands in for the switch, and the detail that opens while it is on. Each
 *          runtime's `SettingRowProps` is this plus its own base props.
 * Boundary: types only. With `value`, `defaultValue` or `onChange` the row draws a switch; otherwise it draws `action`.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); WCAG 2.2 SC 1.3.1, 4.1.2; design-system gap
 *          inventory row 37.
 */
import type { ReactNode } from "react";

import type { IconSlot } from "#contracts/types/icon-slot.type";

/** Props shared by the web and native `SettingRow`. */
export interface SettingRowContractProps {
  /** The setting, for example "Print receipts automatically"; it names the switch. */
  readonly title: string;
  /** One line on what the setting does; it describes the switch. */
  readonly description?: string | undefined;
  /** An icon at the inline start. */
  readonly icon?: IconSlot;
  /** Whether the setting is on, for a controlled switch. */
  readonly value?: boolean | undefined;
  /** Whether the setting starts on, for an uncontrolled switch. */
  readonly defaultValue?: boolean | undefined;
  /** Called with the new state when the user flips the switch. */
  readonly onChange?: ((value: boolean) => void) | undefined;
  /** True to refuse changes; the row stays readable. */
  readonly isDisabled?: boolean | undefined;
  /** A control at the inline end in place of the switch, usually a Button or a Link ("Manage"). */
  readonly action?: ReactNode;
  /** More settings that open under the row while the switch is on. */
  readonly detail?: ReactNode;
}
