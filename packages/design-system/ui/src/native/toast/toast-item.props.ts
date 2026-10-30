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
import type { ToastVariant } from "#contracts/enums/toast-variant.enum";
import type { IconSlot } from "#contracts/types/icon-slot.type";
import type { ToastAction } from "#contracts/types/toast-action.type";
import type { ToastAvatar } from "#contracts/types/toast-avatar.type";

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
  /** The person the toast is about, drawn in place of the icon. */
  readonly avatar?: ToastAvatar | undefined;
  /** The look the provider gives every toast. Defaults to `alert`. */
  readonly variant?: ToastVariant | undefined;
  /** The one action beside the message. */
  readonly action?: ToastAction | undefined;
  /** True while a promise toast's work runs: a spinner stands in for the icon. */
  readonly isLoading?: boolean | undefined;
  /** An undo toast's countdown, in milliseconds: the seconds left count down in a ring in place of the icon. */
  readonly countdown?: number | undefined;
  /** The accessible name of the dismiss button. */
  readonly dismissLabel: string;
}
