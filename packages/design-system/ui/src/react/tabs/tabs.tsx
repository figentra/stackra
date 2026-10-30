/**
 * Stackra file contract:
 * Purpose: the web `Tabs` on HeroUI v3's Tabs (React Aria's tab list): draws the shared contract (`items`, `label`,
 *          `orientation`, `variant`, `isDisabled`, the selection without a mode, `emptyState`, `isLoading`,
 *          `loadingLabel`, `overflow` and `onClose`) as HeroUI's list container, tab list, tabs, selection indicator and
 *          panels, reports the selected tab as a list of one id, and passes every other HeroUI Tabs prop through.
 * Boundary: the look is HeroUI's, themed by `@stackra/tokens`. Arrow keys move between tabs and select as they go,
 *           Home and End jump to the ends, and only the selected panel is drawn, all React Aria's. With no tabs,
 *           `emptyState` stands in for the whole component, or a named busy spinner while `isLoading`; once tabs
 *           exist, `isLoading` changes nothing and they stay usable. With `overflow="scroll"` (the default) HeroUI's
 *           list container scrolls and adds two overflow buttons that name themselves in English ("Scroll tabs left"),
 *           a known limit of HeroUI 3.2.6. With `overflow="menu"` the tabs are measured once at full width, and those
 *           that do not fit (never the selected one) move into a "More" menu after the row, re-fitted as the row
 *           resizes; picking one selects it. A closable tab draws a close mark the pointer presses (hidden from
 *           assistive tech, since a button inside a tab is not allowed) and closes on Delete or Backspace, which the
 *           tab's description says ("Close Orders: Delete"). At the `full` motion level the selection indicator glides on the
 *           shared `SPRING` curve (a light overshoot) instead of HeroUI's ease; below it, HeroUI's own timing stands
 *           and the system setting stills it.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (UI contract, HeroUI v3 on web); ADR 0313 (decisions 1, 2, 5);
 *          WAI-ARIA 1.2 tabs pattern; owner decision 6 of STA-350 (thin wrappers); STA-1371 (wave C).
 */
import {
  type KeyboardEvent,
  type ReactElement,
  type SyntheticEvent,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Tabs as HeroTabs } from "@heroui/react";

import { NAVIGATION_KEYS } from "#core/constants/navigation-keys.constant";
import { SPRING } from "#core/constants/spring.constant";
import { fitTabs } from "#core/functions/fit-tabs.function";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { Button } from "#react/button/button";
import { useMotion } from "#react/design-system-provider/use-motion";
import { useUiText } from "#react/hooks/use-ui-text";
import { Icon } from "#react/icon/icon";
import { Menu } from "#react/menu/menu";
import { Spinner } from "#react/spinner/spinner";
import type { TabsProps } from "#react/tabs/tabs.props";

/** The tabs' keys. */
const K = NAVIGATION_KEYS.ui.tabs;

/** The indicator's glide on the shared spring. */
const SPRING_STYLE = {
  transitionDuration: `${SPRING.durationMs}ms`,
  transitionTimingFunction: SPRING.css,
} as const;

/**
 * A ref that keeps only the element on the page: React Aria also renders the tabs' children into an inert
 * `<template>` to build its collection, and that copy has no layout to measure.
 */
const live =
  (keep: (node: HTMLDivElement) => void) =>
  (node: HTMLDivElement | null): void => {
    if (node?.ownerDocument.defaultView && !node.closest("template")) keep(node);
  };

/** Keeps a press on the close mark from reaching the tab, which would select it. */
const stop = (event: SyntheticEvent) => event.stopPropagation();

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
  overflow = "scroll",
  onClose,
  ...rest
}: TabsProps): ReactElement {
  const motion = useMotion();
  const t = useUiText();
  const baseId = useId();
  const first = items.find((item) => !item.isDisabled)?.id;
  const [own, setOwn] = useState(defaultSelectedKeys?.[0]);
  // React Aria always has a tab chosen (its key type has no `null`), so an empty or unknown choice shows the first usable one.
  const chosen = selectedKeys ? selectedKeys[0] : own;
  const selected = items.some((item) => item.id === chosen) ? chosen : first;
  const select = (id: string) => {
    setOwn(id);
    onSelectionChange?.([id]);
  };

  // State, not a ref: React Aria draws the real row a render after the first, and the measuring waits for it.
  const [row, setRow] = useState<HTMLDivElement | null>(null);
  const more = useRef<HTMLDivElement>(null);
  const widths = useRef(new Map<string, number>());
  const chrome = useRef(0);
  const [rowWidth, setRowWidth] = useState(0);
  // The tabs kept in the row, and the tab list they were fitted for: a new list is measured at full width again.
  const [fitted, setFitted] = useState<{
    readonly ids: string;
    readonly shown: readonly string[];
  }>();
  const isMenu = overflow === "menu" && orientation !== "vertical";
  const ids = items.map((item) => item.id).join("\n");
  const shown = fitted?.ids === ids ? fitted.shown : null;

  // Measure every tab at full width whenever the tabs change; the cached widths re-fit the row as it resizes.
  useLayoutEffect(() => {
    if (!isMenu || !row) return;
    const all = items.map((item) => item.id);
    const key = all.join("\n");
    const isFresh = fitted?.ids !== key;
    if (isFresh) {
      let sum = 0;
      for (const tab of row.querySelectorAll<HTMLElement>("[data-tab-id]")) {
        const width = tab.offsetWidth;
        widths.current.set(tab.dataset["tabId"] ?? "", width);
        sum += width;
      }
      const list = row.querySelector<HTMLElement>("[role=tablist]");
      chrome.current = Math.max(0, (list?.scrollWidth ?? sum) - sum);
    }
    const fit = fitTabs(all, widths.current, selected, rowWidth || row.clientWidth, {
      chrome: chrome.current,
      more: more.current?.offsetWidth ?? 0,
    });
    // oxlint-disable-next-line react/set-state-in-effect -- reason: the fit is read from the laid-out DOM, which only an effect can measure
    if (isFresh || fit.join("\n") !== fitted.shown.join("\n")) setFitted({ ids: key, shown: fit });
  }, [isMenu, row, fitted, selected, rowWidth, items]);
  useLayoutEffect(() => {
    if (!isMenu || !row || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => setRowWidth(entry?.contentRect.width ?? 0));
    observer.observe(row);
    return () => observer.disconnect();
  }, [isMenu, row]);

  if (items.length === 0) {
    return isLoading ? (
      <div aria-busy="true">
        <Spinner {...(loadingLabel === undefined ? {} : { label: loadingLabel })} />
      </div>
    ) : (
      <>{emptyState}</>
    );
  }
  const visible = isMenu && shown ? items.filter((item) => shown.includes(item.id)) : items;
  const hidden = isMenu && shown ? items.filter((item) => !shown.includes(item.id)) : [];
  const list = (
    <HeroTabs.ListContainer {...(isMenu ? { className: "min-w-0 flex-1" } : {})}>
      <HeroTabs.List {...(label === undefined ? {} : { "aria-label": label })}>
        {visible.map((item) => {
          const canClose = Boolean(item.isClosable && onClose && !isDisabled);
          return (
            <HeroTabs.Tab
              key={item.id}
              id={item.id}
              data-tab-id={item.id}
              {...(canClose
                ? {
                    "aria-describedby": `${baseId}-close-${item.id}`,
                    onKeyDown: (event: KeyboardEvent) => {
                      if (event.key === "Delete" || event.key === "Backspace") onClose?.(item.id);
                    },
                  }
                : {})}
            >
              {/* Its own positioned element, above the indicator, so a checker finds the label's colour on the indicator; one line,
                 so a long label widens its tab in the scrolling row instead of wrapping and clipping. */}
              <span className="relative z-10 whitespace-nowrap">{item.label}</span>
              {canClose ? (
                // oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- reason: the keyboard closes the tab with Delete; a button inside a tab is not allowed
                <span
                  aria-hidden
                  title={t(K.close, { tab: item.label })}
                  data-slot="tab-close"
                  className="relative z-10 -me-2 ms-1 flex size-5 items-center justify-center rounded-[var(--radius-pill)] text-muted hover:bg-default hover:text-foreground [&_svg]:size-3.5"
                  onPointerDown={stop}
                  onPointerUp={stop}
                  onMouseDown={stop}
                  onClick={(event) => {
                    event.stopPropagation();
                    onClose?.(item.id);
                  }}
                >
                  <Icon name="x" />
                  {/* The tab's description: what Delete does, read although the mark itself is hidden. */}
                  <span id={`${baseId}-close-${item.id}`} className="sr-only">
                    {`${t(K.close, { tab: item.label })}: Delete`}
                  </span>
                </span>
              ) : null}
              <HeroTabs.Indicator {...(motion === "full" ? { style: SPRING_STYLE } : {})} />
            </HeroTabs.Tab>
          );
        })}
      </HeroTabs.List>
    </HeroTabs.ListContainer>
  );
  return (
    <HeroTabs
      {...rest}
      {...omitUndefined({ orientation, variant, isDisabled, selectedKey: selected })}
      disabledKeys={items.filter((item) => item.isDisabled).map((item) => item.id)}
      onSelectionChange={(key) => select(String(key))}
    >
      {isMenu ? (
        <div ref={live(setRow)} data-slot="tabs-row" className="flex min-w-0 items-center gap-2">
          {list}
          <div
            ref={live((node) => {
              more.current = node;
            })}
            className={hidden.length === 0 ? "invisible absolute end-0" : "shrink-0"}
            {...(hidden.length === 0 ? { "aria-hidden": true } : {})}
          >
            <Menu
              sections={[
                {
                  id: "more",
                  title: t(K.more_label),
                  isTitleHidden: true,
                  items: hidden.map((item) => ({
                    id: item.id,
                    label: item.label,
                    ...(item.isDisabled ? { isDisabled: true } : {}),
                  })),
                },
              ]}
              onAction={select}
              align="end"
            >
              <Button
                variant="ghost"
                size="sm"
                endIcon="chevron-down"
                isDisabled={Boolean(isDisabled) || hidden.length === 0}
              >
                {t(K.more)}
              </Button>
            </Menu>
          </div>
        </div>
      ) : (
        list
      )}
      {items.map((item) => (
        <HeroTabs.Panel key={item.id} id={item.id}>
          {item.content}
        </HeroTabs.Panel>
      ))}
    </HeroTabs>
  );
}
