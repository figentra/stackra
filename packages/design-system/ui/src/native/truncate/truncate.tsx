/**
 * Stackra file contract:
 * Purpose: the native `Truncate`: text clamped to `lines` with a Show more / Show less button once the text is really
 *          cut. Touch has no hover, so the `tooltip` mode opens the same way.
 * Boundary: the cut is learnt from the text's layout (`onTextLayout`); the button says whether the text is open.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 4.1.2; STA-1371.
 */
import { useState, type ReactElement } from "react";
import { Pressable, View } from "react-native";

import { DISPLAY_KEYS } from "#core/constants/display-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import { Text } from "#native/text/text";
import type { TruncateProps } from "#native/truncate/truncate.props";

/** The truncate's keys. */
const K = DISPLAY_KEYS.ui.truncate;

/** Clamped text that can open. */
export function Truncate({
  children,
  lines = 3,
  defaultExpanded = false,
  className,
}: TruncateProps): ReactElement {
  const t = useUiText();
  const [isOpen, setOpen] = useState(defaultExpanded);
  const [isCut, setCut] = useState(false);
  return (
    <View className={`items-start gap-1 ${className ?? ""}`}>
      {/* shortcut: Android reports only the clamped lines, so a text of exactly `lines` lines shows no button there; measure an unclamped copy if that matters. */}
      <Text
        numberOfLines={isOpen ? undefined : lines}
        onTextLayout={(event) => {
          if (event.nativeEvent.lines.length > lines) setCut(true);
        }}
      >
        {children}
      </Text>
      {isCut || isOpen ? (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: isOpen }}
          onPress={() => setOpen(!isOpen)}
          className="min-h-11 justify-center"
        >
          <Text className="font-medium text-accent-soft-foreground">{t(isOpen ? K.less : K.more)}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
