/**
 * Stackra file contract:
 * Purpose: the native `OverflowList`: a wrapping row of chips that shows `maxVisible` of them and folds the rest into
 *          one "+N more" button whose accessibility hint names the folded items; pressing it expands the row in place
 *          and "Show less" folds it again. The row's height animates between the two.
 * Boundary: it keeps only whether it is expanded. The height animation is a Reanimated layout transition that is left
 *           out under the system's reduce-motion setting. The words come from the `ui` catalogue in the active locale.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0329 (motion layer); design-system gap
 *          inventory (2026-10-28) row 24.
 */
import { motionTiming, STACKRA_THEME } from "@stackra/tokens";
import { useState, type ReactElement } from "react";
import { View } from "react-native";
import Animated, { FadeIn, LinearTransition, useReducedMotion } from "react-native-reanimated";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { listFormatOf } from "#core/functions/list-format-of.function";
import { Button } from "#native/button/button";
import { Chip } from "#native/chip/chip";
import { useDesignSystem } from "#native/design-system-provider/use-design-system";
import { useUiText } from "#react/hooks/use-ui-text";
import type { OverflowListProps } from "#native/overflow-list/overflow-list.props";

/** How long the height takes to follow a fold or an expand, in milliseconds. */
const EXPAND_MS = motionTiming(STACKRA_THEME, "moderate").durationMs;

/** Chips past `maxVisible` fold into "+N more"; pressing it expands the row. */
export function OverflowList({
  items,
  maxVisible = 3,
  label,
  defaultExpanded = false,
  size = "sm",
  tone = "default",
  className,
  ...rest
}: OverflowListProps): ReactElement {
  const t = useUiText();
  const { locale } = useDesignSystem();
  const isReduced = useReducedMotion();
  const [isExpanded, setExpanded] = useState(defaultExpanded);
  const folded = items.slice(maxVisible);
  const shown = isExpanded || folded.length === 0 ? items : items.slice(0, maxVisible);
  const motion = isReduced ? {} : { layout: LinearTransition.duration(EXPAND_MS) };

  return (
    <View
      {...rest}
      accessibilityRole="list"
      accessibilityLabel={label}
      {...(className === undefined ? {} : { className })}
    >
      <Animated.View {...motion} className="flex-row flex-wrap items-center gap-1.5">
        {shown.map((item, index) => (
          <Animated.View
            key={item.id}
            className="max-w-48"
            {...(isReduced || index < maxVisible ? {} : { entering: FadeIn.duration(EXPAND_MS) })}
          >
            <Chip size={size} tone={tone}>
              {item.label}
            </Chip>
          </Animated.View>
        ))}
        {folded.length === 0 ? null : (
          <Button
            variant="ghost"
            size="sm"
            accessibilityState={{ expanded: isExpanded }}
            {...(isExpanded
              ? {}
              : {
                  // shortcut: a comma join where Hermes lacks Intl.ListFormat; drop the fallback once every engine has it.
                  accessibilityHint:
                    typeof Intl.ListFormat === "function"
                      ? listFormatOf(locale, { type: "conjunction" }).format(
                          folded.map((item) => item.label),
                        )
                      : folded.map((item) => item.label).join(", "),
                })}
            onPress={() => setExpanded(!isExpanded)}
          >
            {isExpanded
              ? t(UI_KEYS.ui.overflow_list.less)
              : t(UI_KEYS.ui.overflow_list.more, { count: folded.length })}
          </Button>
        )}
      </Animated.View>
    </View>
  );
}
