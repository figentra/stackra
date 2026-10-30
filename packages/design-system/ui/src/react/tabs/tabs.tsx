/**
 * Stackra file contract:
 * Purpose: the web `Tabs` on HeroUI v3's Tabs (React Aria's tab list): draws the shared contract (`items`, `label`,
 *          `orientation`, `variant`, `isDisabled`, the selection without a mode, `emptyState`, `isLoading` and
 *          `loadingLabel`) as HeroUI's list container, tab list, tabs, selection indicator and panels, reports the
 *          selected tab as a list of one id, and passes every other HeroUI Tabs prop through.
 * Boundary: no styling of its own; the look is HeroUI's, themed by `@stackra/tokens`. Arrow keys move between tabs
 *           and select as they go, Home and End jump to the ends, and only the selected panel is drawn, all React
 *           Aria's. With no tabs, `emptyState` stands in for the whole component, or a named busy spinner while
 *           `isLoading`; once tabs exist, `isLoading` changes nothing and they stay usable. HeroUI's list container adds
 *           two overflow buttons that name themselves in English ("Scroll tabs left"); they are hidden until the tabs
 *           overflow and are not translated by this wrapper (a known limit of HeroUI 3.2.6). At the `full` motion level
 *           the selection indicator glides on the shared `SPRING` curve (a light overshoot) instead of HeroUI's ease;
 *           below it, HeroUI's own timing stands and the system setting stills it.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (UI contract, HeroUI v3 on web); ADR 0313 (decisions 1, 2, 5);
 *          WAI-ARIA 1.2 tabs pattern; owner decision 6 of STA-350 (thin wrappers).
 */
import type { ReactElement } from "react";
import { Tabs as HeroTabs } from "@heroui/react";

import { SPRING } from "#core/constants/spring.constant";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { useMotion } from "#react/design-system-provider/use-motion";
import { Spinner } from "#react/spinner/spinner";
import type { TabsProps } from "#react/tabs/tabs.props";

/** The indicator's glide on the shared spring. */
const SPRING_STYLE = {
  transitionDuration: `${SPRING.durationMs}ms`,
  transitionTimingFunction: SPRING.css,
} as const;

/**
 * A row of tabs over one panel each. The selection is the list of the one selected id; `onSelectionChange` is called
 * with it whenever the user picks another tab.
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
  orientation,
  variant,
  isDisabled,
  ...rest
}: TabsProps): ReactElement {
  const motion = useMotion();
  if (items.length === 0) {
    return isLoading ? (
      <div aria-busy="true">
        <Spinner {...(loadingLabel === undefined ? {} : { label: loadingLabel })} />
      </div>
    ) : (
      <>{emptyState}</>
    );
  }
  return (
    <HeroTabs
      {...rest}
      {...omitUndefined({
        orientation,
        variant,
        isDisabled,
        // React Aria always has a tab chosen (its key type has no `null`), so a controlled empty list shows the first usable one.
        selectedKey:
          selectedKeys && (selectedKeys[0] ?? items.find((item) => !item.isDisabled)?.id),
      })}
      {...(defaultSelectedKeys?.[0] === undefined
        ? {}
        : { defaultSelectedKey: defaultSelectedKeys[0] })}
      disabledKeys={items.filter((item) => item.isDisabled).map((item) => item.id)}
      onSelectionChange={(key) => onSelectionChange?.([String(key)])}
    >
      <HeroTabs.ListContainer>
        <HeroTabs.List {...(label === undefined ? {} : { "aria-label": label })}>
          {items.map((item) => (
            <HeroTabs.Tab key={item.id} id={item.id}>
              {/* Its own positioned element, above the indicator, so a checker finds the label's colour on the indicator; one line,
                 so a long label widens its tab in the scrolling row instead of wrapping and clipping. */}
              <span className="relative z-10 whitespace-nowrap">{item.label}</span>
              <HeroTabs.Indicator {...(motion === "full" ? { style: SPRING_STYLE } : {})} />
            </HeroTabs.Tab>
          ))}
        </HeroTabs.List>
      </HeroTabs.ListContainer>
      {items.map((item) => (
        <HeroTabs.Panel key={item.id} id={item.id}>
          {item.content}
        </HeroTabs.Panel>
      ))}
    </HeroTabs>
  );
}
