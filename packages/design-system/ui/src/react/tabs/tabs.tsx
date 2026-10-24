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
 *           overflow and are not translated by this wrapper (a known limit of HeroUI 3.2.6).
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (UI contract, HeroUI v3 on web); ADR 0313 (decisions 1, 2, 5);
 *          WAI-ARIA 1.2 tabs pattern; owner decision 6 of STA-350 (thin wrappers).
 */
import { Tabs as HeroTabs, type TabsRootProps } from "@heroui/react";

import type { TabsContractProps } from "#contracts/types/tabs-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { Spinner } from "#react/spinner/spinner";

/**
 * Props of the web Tabs: the shared contract plus HeroUI v3's own tabs props, passed through unchanged. The tabs are
 * `items`, never children, and the selection is a list of ids, never HeroUI's `selectedKey`.
 */
export type TabsProps = TabsContractProps &
  Omit<
    TabsRootProps,
    | keyof TabsContractProps
    | "children"
    | "selectedKey"
    | "defaultSelectedKey"
    | "onSelectionChange"
    | "disabledKeys"
  >;

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
}: TabsProps) {
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
              {item.label}
              <HeroTabs.Indicator />
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
