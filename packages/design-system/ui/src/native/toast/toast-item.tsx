/**
 * Stackra file contract:
 * Purpose: draws one toast on native from HeroUI Native's Toast parts: the tone's icon (or the caller's, or none), the
 *          message, the description, the action and a dismiss button named by the provider, with the tone's
 *          live-region attributes on the toast.
 * Boundary: internal, not in the `native` barrel; `toast()` renders it through HeroUI Native's `component` option, which
 *           HeroUI's own text-only toast lacks a dismiss button for (it can only be swiped away). HeroUI Native gives
 *           every toast `role="status"` and `aria-live="polite"`; this raises warning and danger to `alert` and
 *           assertive. The icon sits in a `View` and the texts are HeroUI's own `Text` parts, so no bare string
 *           reaches a `View`.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0312 (decision 3); WCAG 2.2 SC 2.5.8 and 4.1.3.
 */
import { Toast as HeroToast, type ToastComponentProps } from "heroui-native";
import type { ReactElement } from "react";
import { View } from "react-native";

import type { Tone } from "#contracts/enums/tone.enum";
import type { IconSlot } from "#contracts/types/icon-slot.type";
import type { ToastAction } from "#contracts/types/toast-contract-props.type";
import { liveRegionOf } from "#core/functions/live-region-of.function";
import { FeedbackIcon } from "#native/feedback-icon/feedback-icon";

/** Props of ToastItem. */
export interface ToastItemProps {
  /** What HeroUI Native hands a toast component: its id, position in the stack, and `hide`. */
  readonly toast: ToastComponentProps;
  /** The tone of the message. */
  readonly tone: Tone;
  /** The message. */
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

/** One toast: icon, message, description, action and dismiss button, announced by its tone. */
export function ToastItem({
  toast,
  tone,
  title,
  description,
  icon,
  action,
  dismissLabel,
}: ToastItemProps): ReactElement {
  return (
    <HeroToast
      {...toast}
      {...liveRegionOf(tone)}
      variant={tone}
      className="flex-row items-center gap-3"
    >
      {icon === false ? null : (
        <View>
          <FeedbackIcon tone={tone} icon={icon} />
        </View>
      )}
      <View className="flex-1">
        <HeroToast.Title>{title}</HeroToast.Title>
        {description ? <HeroToast.Description>{description}</HeroToast.Description> : null}
      </View>
      {action === undefined ? null : (
        <HeroToast.Action
          onPress={() => {
            action.onPress();
            toast.hide(toast.id);
          }}
        >
          {action.label}
        </HeroToast.Action>
      )}
      <HeroToast.Close aria-label={dismissLabel} />
    </HeroToast>
  );
}
