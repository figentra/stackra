/**
 * Stackra file contract:
 * Purpose: the web `NavigationMenu`: a `nav` landmark holding a row of top-level entries. A link entry is a link; an
 *          entry with children is a button that opens a panel of their links under it, each with its icon and a line
 *          under its name, in one column or two (a mega menu).
 * Boundary: the disclosure navigation pattern on React Aria, through the design system's `Popover`: the button carries
 *           `aria-expanded`, Enter, Space or a press opens the panel and moves focus into it, Tab walks its links,
 *           Escape or a press outside closes it and focus returns to the button; choosing a link closes it. Panels open
 *           on press, not hover, so touch and keyboard work alike. The current page's link carries
 *           `aria-current="page"`, and the button of the panel that holds it is drawn current. The row and the panels
 *           follow the reading direction (logical placement and properties), so the bar mirrors in right-to-left; the
 *           panel's motion is the Popover's, which honours reduced motion.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (web); ADR 0060 (right-to-left); WAI-ARIA disclosure
 *          navigation pattern; WCAG 2.2 SC 2.1.1, 2.4.3 and 4.1.2; STA-1371 (wave C).
 */
import { buttonVariants, cn } from "@heroui/react";
import { type ReactElement, useState } from "react";
import { Link as AriaLink } from "react-aria-components";

import type { NavigationItem } from "#contracts/types/navigation-item.type";
import { NAVIGATION_KEYS } from "#core/constants/navigation-keys.constant";
import { currentStateOf } from "#core/functions/current-state-of.function";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { Button } from "#react/button/button";
import { useUiText } from "#react/hooks/use-ui-text";
import type { NavigationMenuProps } from "#react/navigation-menu/navigation-menu.props";
import { Popover } from "#react/popover/popover";
import { SlotIcon } from "#react/slot-icon/slot-icon";

/** The classes of a top-level entry; the current one is bold on a filled track. */
const TOP =
  "h-9 px-3 data-[current=true]:font-semibold data-[current=true]:[--button-bg:var(--default)]";

/** A top-level bar of links and panels of links. */
export function NavigationMenu({
  items,
  label,
  columns = 1,
  className,
}: NavigationMenuProps): ReactElement {
  const t = useUiText();
  const [open, setOpen] = useState<string | null>(null);

  /** One link, at the top or in a panel. */
  const link = (item: NavigationItem, isTop: boolean) => (
    <AriaLink
      {...omitUndefined({
        href: item.isDisabled ? undefined : item.href,
        onPress: () => {
          item.onPress?.();
          setOpen(null);
        },
        isDisabled: item.isDisabled,
        "aria-current": item.isCurrent ? ("page" as const) : undefined,
        "data-current": item.isCurrent ? "true" : undefined,
      })}
      className={
        isTop
          ? (cn(buttonVariants({ variant: "ghost", size: "sm" }), TOP) ?? "")
          : "flex items-start gap-3 rounded-[var(--radius-control)] p-3 text-start text-foreground no-underline outline-none hover:bg-default focus-visible:ring-2 focus-visible:ring-focus data-[current=true]:bg-default [&_svg]:mt-0.5 [&_svg]:size-5 [&_svg]:shrink-0 [&_svg]:text-muted"
      }
    >
      {isTop || item.icon === undefined ? null : <SlotIcon icon={item.icon} />}
      {isTop ? (
        item.label
      ) : (
        <span className="grid min-w-0 gap-0.5">
          <span className="text-sm font-medium">{item.label}</span>
          {item.description ? <span className="text-xs text-muted">{item.description}</span> : null}
        </span>
      )}
    </AriaLink>
  );

  return (
    <nav
      aria-label={label ?? t(NAVIGATION_KEYS.ui.navigation_menu.label)}
      data-slot="navigation-menu"
      className={className}
    >
      <ul className="m-0 flex list-none flex-wrap items-center gap-1 p-0">
        {items.map((item) => (
          <li key={item.id}>
            {item.children && item.children.length > 0 ? (
              <Popover
                aria-label={item.label}
                placement="bottom"
                align="start"
                isOpen={open === item.id}
                onOpenChange={(isOpen) => setOpen(isOpen ? item.id : null)}
                trigger={
                  <Button
                    variant="ghost"
                    size="sm"
                    endIcon="chevron-down"
                    {...omitUndefined({
                      isDisabled: item.isDisabled,
                      "data-current": currentStateOf(item) === "none" ? undefined : "true",
                    })}
                    className={`${TOP} [&_svg]:transition-transform aria-expanded:[&_svg]:rotate-180 motion-reduce:[&_svg]:transition-none`}
                  >
                    {item.label}
                  </Button>
                }
              >
                <ul
                  className={cn(
                    "m-0 grid list-none gap-1 p-0",
                    columns === 2 ? "w-[min(36rem,calc(100vw-2rem))] sm:grid-cols-2" : "w-72",
                  )}
                >
                  {item.children.map((child) => (
                    <li key={child.id}>{link(child, false)}</li>
                  ))}
                </ul>
              </Popover>
            ) : (
              link(item, true)
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
