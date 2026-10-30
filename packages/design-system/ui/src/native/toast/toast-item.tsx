/**
 * Stackra file contract:
 * Purpose: draws one toast on native from HeroUI Native's Toast parts, as the web lays it out: the tone's icon (or the
 *          caller's, or none; a spinner while a promise toast's work runs; an undo toast's seconds left) at the start, the message with its description below, the optional action, and the
 *          dismiss button (named by the provider, 24 pt) inside the card at the end of the title row. The card is the
 *          overlay surface with the overlay shadow; the tone colours only the icon (and the bar looks' thin start
 *          edge), the text stays foreground. The tone's live-region attributes sit on the toast. Looks: the `alert` card, a compact `bar` with the tone
 *          on its inline-start edge, the bar flipping in (`flip-bar`, Reanimated's flip entrance, at the `full` motion
 *          level only), or a round `bubble` made for the person's `avatar`, which replaces the icon.
 * Boundary: internal, not in the `native` barrel; `toast()` renders it through HeroUI Native's `component` option, which
 *           HeroUI's own text-only toast lacks a dismiss button for (it can only be swiped away). HeroUI Native gives
 *           every toast `role="status"` and `aria-live="polite"`; this raises warning and danger to `alert` and
 *           assertive. The icon sits in a `View` and the texts are HeroUI's own `Text` parts, so no bare string
 *           reaches a `View`.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0312 (decision 3); WCAG 2.2 SC 2.5.8 and 4.1.3.
 */
import { Toast as HeroToast } from "heroui-native";
import { useEffect, type ReactElement } from "react";
import { View } from "react-native";
import { FlipInXDown, FlipInXUp } from "react-native-reanimated";

import type { ToastVariant } from "#contracts/enums/toast-variant.enum";
import { TOAST_KEYS } from "#core/constants/toast-keys.constant";
import { liveRegionOf } from "#core/functions/live-region-of.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { Avatar } from "#native/avatar/avatar";
import { useMotion } from "#native/design-system-provider/use-motion";
import { FeedbackIcon } from "#native/feedback-icon/feedback-icon";
import type { HapticKind } from "#native/haptics/haptic-kind.type";
import { haptics } from "#native/haptics/haptics";
import { Spinner } from "#native/spinner/spinner";
import type { ToastItemProps } from "#native/toast/toast-item.props";
import { UndoCountdown } from "#native/toast/undo-countdown";

/** The outcome feedback of each tone that has one. */
const TONE_HAPTICS: Readonly<Partial<Record<ToastItemProps["tone"], HapticKind>>> = {
  success: "success",
  warning: "warning",
  danger: "error",
};

/** The tone on the inline-start edge of a bar. */
const BAR_EDGE: Readonly<Record<ToastItemProps["tone"], string>> = {
  default: "border-s-border",
  accent: "border-s-accent",
  success: "border-s-success",
  warning: "border-s-warning",
  danger: "border-s-danger",
};

/** The flip entrance of a `flip-bar`, from the edge the toast sits against. */
const FLIP = { entering: { top: FlipInXUp, bottom: FlipInXDown } } as const;

/** The classes of one look, beside the row layout every look shares. */
function lookClassName(variant: ToastVariant, tone: ToastItemProps["tone"]): string {
  if (variant === "bubble") return "items-center rounded-[var(--radius-pill)] py-2 ps-2 pe-2";
  if (variant === "alert") return "";
  return `border-s-2 ${BAR_EDGE[tone]}`;
}

/** One toast: icon, message, description, action and dismiss button, announced by its tone. */
export function ToastItem({
  toast,
  tone,
  title,
  description,
  icon,
  avatar,
  action,
  isLoading,
  countdown,
  dismissLabel,
  variant = "alert",
}: ToastItemProps): ReactElement {
  const motion = useMotion();
  const t = useUiText();
  // Played once, when the toast appears; a neutral toast plays nothing.
  useEffect(() => {
    const kind = TONE_HAPTICS[tone];
    if (kind) haptics.play(kind);
  }, [tone]);
  return (
    <HeroToast
      {...toast}
      {...liveRegionOf(tone)}
      variant={tone}
      className={`flex-row items-start gap-3 bg-overlay py-3 ps-3 pe-2 shadow-overlay ${lookClassName(variant, tone)}`}
      {...(variant === "flip-bar" && motion === "full" ? { animation: FLIP } : {})}
    >
      {isLoading ? (
        <View>
          <Spinner size="sm" tone="muted" />
        </View>
      ) : countdown !== undefined ? (
        <View>
          <UndoCountdown duration={countdown} />
        </View>
      ) : avatar ? (
        <View>
          <Avatar name={avatar.name} size="sm" {...(avatar.src ? { src: avatar.src } : {})} />
        </View>
      ) : icon === false ? null : (
        <View>
          <FeedbackIcon tone={tone} icon={icon} />
        </View>
      )}
      <View className="flex-1 gap-0.5">
        <HeroToast.Title className="text-overlay-foreground">{title}</HeroToast.Title>
        {description ? (
          <HeroToast.Description className="text-muted">{description}</HeroToast.Description>
        ) : null}
      </View>
      {action === undefined ? null : (
        <HeroToast.Action
          className="self-center"
          onPress={() => {
            action.onPress();
            toast.hide(toast.id);
          }}
        >
          {action.label || t(TOAST_KEYS.ui.toast.undo)}
        </HeroToast.Action>
      )}
      <HeroToast.Close aria-label={dismissLabel} className="size-6 self-start" />
    </HeroToast>
  );
}
