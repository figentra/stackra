/**
 * Stackra file contract:
 * Purpose: the native `CopyButton`: an IconButton that writes `value` to the clipboard through `expo-clipboard`, then
 *          zooms its copy icon into a success check for two seconds, renames itself "Copied" and announces it to
 *          VoiceOver and TalkBack. The press plays the Button's light haptic.
 * Boundary: without the optional `expo-clipboard` peer the button is disabled. The morph is a Reanimated entering
 *           animation that follows the system's reduced-motion setting (then the icons swap at once).
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0312; design-system gap inventory row 35; WCAG 2.2 SC 4.1.3.
 */
import { motionTiming, STACKRA_THEME } from "@stackra/tokens";
import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";
import Animated, { ReduceMotion, ZoomIn } from "react-native-reanimated";
import type { ReactElement } from "react";

import { COPIED_RESET_MS } from "#core/constants/copied-reset-ms.constant";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import { loadClipboard } from "#native/copy-button/load-clipboard.function";
import { Icon } from "#native/icon/icon";
import { IconButton } from "#native/icon-button/icon-button";
import type { CopyButtonProps } from "#native/copy-button/copy-button.props";

const FAST = motionTiming(STACKRA_THEME, "fast");

/** A button that copies a value (an order number, an API key, a link) and confirms it with a check. */
export function CopyButton({
  value,
  label: labelProp,
  copiedLabel,
  onCopy,
  variant = "ghost",
  isDisabled = false,
  ...rest
}: CopyButtonProps): ReactElement {
  const t = useUiText();
  const clipboard = loadClipboard();
  // The time of the last copy, so a second copy restarts the two seconds.
  const [copiedAt, setCopiedAt] = useState<number | null>(null);
  const isCopied = copiedAt !== null;
  const label = labelProp ?? t(UI_KEYS.ui.copy_button.copy);
  const copied = copiedLabel ?? t(UI_KEYS.ui.copy_button.copied);

  useEffect(() => {
    if (copiedAt === null) return;
    const timer = setTimeout(() => setCopiedAt(null), COPIED_RESET_MS);
    return () => clearTimeout(timer);
  }, [copiedAt]);

  const copy = () => {
    clipboard?.setStringAsync(value).then(
      () => {
        setCopiedAt(Date.now());
        AccessibilityInfo.announceForAccessibility(copied);
        onCopy?.(value);
      },
      () => undefined,
    );
  };

  return (
    <IconButton
      {...rest}
      variant={variant}
      isDisabled={isDisabled || clipboard === null}
      label={isCopied ? copied : label}
      onPress={copy}
      icon={
        <Animated.View
          key={isCopied ? "check" : "copy"}
          entering={ZoomIn.duration(FAST.durationMs).reduceMotion(ReduceMotion.System)}
        >
          <Icon
            name={isCopied ? "check" : "copy"}
            {...(isCopied ? { tone: "success" as const } : {})}
          />
        </Animated.View>
      }
    />
  );
}
