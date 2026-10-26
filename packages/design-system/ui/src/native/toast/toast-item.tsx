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
import { Toast as HeroToast } from "heroui-native";
import type { ReactElement } from "react";
import { View } from "react-native";

import { liveRegionOf } from "#core/functions/live-region-of.function";
import { FeedbackIcon } from "#native/feedback-icon/feedback-icon";
import type { ToastItemProps } from "#native/toast/toast-item.props";

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
