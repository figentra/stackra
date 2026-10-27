/**
 * Stackra file contract:
 * Purpose: `ToastItemProps`, the props of the native `ToastItem` in `toast-item.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0312 (decision
 *          3); WCAG 2.2 SC 2.5.8 and 4.1.3.
 */
import type { Tone } from "@stackra/contracts";
import type { ToastComponentProps } from "heroui-native";
import type { IconSlot } from "#contracts/types/icon-slot.type";
import type { ToastAction } from "#contracts/types/toast-action.type";

/** Props of ToastItem. */
export interface ToastItemProps {
  /** What HeroUI Native hands a toast component: its id, position in the stack, and `hide`. */
  readonly toast: ToastComponentProps;
  /** The tone of the message. */
  readonly tone: Tone;
  /** The message the toast shows, as its first line. */
  readonly title: string;
  /** A second line under the message. */
  readonly description?: string | undefined;
  /** The caller's icon, or `false` for none; left out, the tone's icon is drawn. */
  readonly icon?: IconSlot | false | undefined;
  /** The one action beside the message. */
  readonly action?: ToastAction | undefined;
  /** The accessible name of the dismiss button. */
  readonly dismissLabel: string;
}
