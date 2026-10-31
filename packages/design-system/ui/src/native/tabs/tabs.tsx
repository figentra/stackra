/**
 * Stackra file contract:
 * Purpose: the native `Tabs` on HeroUI Native's Tabs: draws the shared contract (`items`, `label`, `variant`,
 *          `isDisabled`, the selection without a mode, `emptyState`, `isLoading` and `loadingLabel`) as HeroUI Native's
 *          list, scroll view, indicator, triggers and content, reports the selected tab as a list of one id, and passes
 *          every other HeroUI Native Tabs prop through.
 * Boundary: no styling of its own. HeroUI Native's tabs always hold a value and have no vertical form, so the wrapper
 *           keeps the selection itself when uncontrolled (starting from the first tab that is not disabled, as React
 *           Aria does on web), and `orientation` is accepted and read as horizontal. The tab list is one scrolling row,
 *           so a long list scrolls instead of wrapping. A string `content` is wrapped in `Text`, because HeroUI Native
 *           draws its content straight into a View, where a bare string is an error. With no tabs, `emptyState` stands
 *           in for the whole component, or a named busy spinner while `isLoading`; once tabs exist, `isLoading`
 *           changes nothing. At the `full` motion level the indicator slides over the theme's indicator step (ADR 0501,
 *           about 250ms on a fluid ease-out) in place of HeroUI Native's stiff default, as the web's does; below it the provider's reduced-motion setting stills
 *           it. A closable tab (with `onClose`) draws a close mark after its label, and a screen reader reaches the same close as
 *           the tab's "Close Orders" action; `overflow` is accepted and read as `scroll`.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (HeroUI Native on native); ADR 0313 (decisions 1, 2, 5 and 7);
 *          owner decision 6 of STA-350 (thin wrappers); STA-1371 (wave C).
 */
import { motionTiming, STACKRA_THEME } from "@stackra/tokens";
import { Tabs as HeroTabs } from "heroui-native";
import { useState, type ReactElement } from "react";
import { Pressable, View } from "react-native";
import { Easing } from "react-native-reanimated";

import { NAVIGATION_KEYS } from "#core/constants/navigation-keys.constant";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { useMotion } from "#native/design-system-provider/use-motion";
import { haptics } from "#native/haptics/haptics";
import { Icon } from "#native/icon/icon";
import { Spinner } from "#native/spinner/spinner";
import { Text } from "#native/text/text";
import type { TabsProps } from "#native/tabs/tabs.props";
import { useUiText } from "#react/hooks/use-ui-text";

const INDICATOR = motionTiming(STACKRA_THEME, "indicator");

/** The indicator's slide: the theme's indicator step. */
const SLIDE = {
  duration: INDICATOR.durationMs,
  easing: Easing.bezier(...(INDICATOR.bezier ?? [0, 0, 1, 1])),
};

/** The indicator's movement on the slide. */
const INDICATOR_ANIMATION = {
  width: { type: "timing", config: SLIDE },
  height: { type: "timing", config: SLIDE },
  translateX: { type: "timing", config: SLIDE },
} as const;

/**
 * A scrolling row of tabs over one panel each. The selection is the list of the one selected id;
 * `onSelectionChange` is called with it whenever the user presses another tab.
 */
export function Tabs({
  items,
  emptyState,
  isLoading,
  loadingLabel,
  selectedKeys,
  defaultSelectedKeys,
  onSelectionChange,
  label,
  // Native tabs run along one axis only.
  orientation: _orientation,
  variant,
  isDisabled,
  // Native tabs always scroll.
  overflow: _overflow,
  onClose,
  ...rest
}: TabsProps): ReactElement {
  const motion = useMotion();
  const t = useUiText();
  const first = items.find((item) => !item.isDisabled)?.id ?? items[0]?.id ?? "";
  const [own, setOwn] = useState<string>(defaultSelectedKeys?.[0] ?? first);
  const value = selectedKeys === undefined ? own : (selectedKeys[0] ?? first);
  if (items.length === 0) {
    return isLoading ? (
      <View accessibilityState={{ busy: true }}>
        <Spinner {...(loadingLabel === undefined ? {} : { label: loadingLabel })} />
      </View>
    ) : (
      <>{emptyState}</>
    );
  }
  return (
    <HeroTabs
      {...rest}
      {...omitUndefined({ variant })}
      value={value}
      onValueChange={(next) => {
        haptics.play("selection");
        setOwn(next);
        onSelectionChange?.([next]);
      }}
    >
      <HeroTabs.List {...(label === undefined ? {} : { accessibilityLabel: label })}>
        <HeroTabs.ScrollView>
          <HeroTabs.Indicator {...(motion === "full" ? { animation: INDICATOR_ANIMATION } : {})} />
          {items.map((item) => {
            const close =
              item.isClosable && onClose && !isDisabled
                ? t(NAVIGATION_KEYS.ui.tabs.close, { tab: item.label })
                : undefined;
            return (
              <HeroTabs.Trigger
                key={item.id}
                value={item.id}
                isDisabled={Boolean(isDisabled || item.isDisabled)}
                {...(close
                  ? {
                      accessibilityActions: [{ name: "close", label: close }],
                      onAccessibilityAction: (event: { nativeEvent: { actionName: string } }) =>
                        event.nativeEvent.actionName === "close" ? onClose?.(item.id) : undefined,
                    }
                  : {})}
              >
                <HeroTabs.Label>{item.label}</HeroTabs.Label>
                {close ? (
                  <Pressable
                    accessible={false}
                    hitSlop={8}
                    className="ms-1 rounded-[var(--radius-pill)] p-0.5"
                    onPress={() => onClose?.(item.id)}
                  >
                    <Icon name="x" size="sm" />
                  </Pressable>
                ) : null}
              </HeroTabs.Trigger>
            );
          })}
        </HeroTabs.ScrollView>
      </HeroTabs.List>
      {items.map((item) => (
        <HeroTabs.Content key={item.id} value={item.id}>
          {typeof item.content === "string" ? <Text>{item.content}</Text> : item.content}
        </HeroTabs.Content>
      ))}
    </HeroTabs>
  );
}
