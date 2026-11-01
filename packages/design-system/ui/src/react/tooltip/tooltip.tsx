/**
 * Stackra file contract:
 * Purpose: the web `Tooltip` on HeroUI v3's Tooltip: one component that takes the element it describes and the text,
 *          and draws HeroUI's root, content and arrow. It maps the shared contract (`placement` and `align` to React
 *          Aria's placement string, `hasArrow` to `showArrow`) and passes every other HeroUI root prop through, such as
 *          `delay`, `closeDelay` and `isDisabled`.
 * Boundary: no styling of its own beyond the rule between the words and a `shortcut`'s keys. React Aria shows the
 *           tooltip on hover and on keyboard focus only, hides it on Escape, keeps it open while the pointer is over
 *           it (WCAG 1.4.13) and names it as the element's description, never its name.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0312; ADR 0165 (HeroUI v3 on web); WCAG 2.2
 *          SC 1.4.13, 4.1.2.
 */
import { Tooltip as HeroTooltip } from "@heroui/react";
import type { ReactElement } from "react";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import { reactAriaPlacementOf } from "#core/functions/react-aria-placement-of.function";
import { ShortcutHint } from "#react/shortcut-hint/shortcut-hint";
import type { TooltipProps } from "#react/tooltip/tooltip.props";

/**
 * A short label for an element, shown on hover and on keyboard focus. The element keeps its own accessible name; the
 * tooltip adds a description. Anything the user must press or read at length belongs in a Popover.
 */
export function Tooltip({
  children,
  content,
  hasArrow,
  placement = "top",
  align,
  isOpen,
  defaultOpen,
  onOpenChange,
  shortcut,
  ...rest
}: TooltipProps): ReactElement {
  return (
    <HeroTooltip {...rest} {...omitUndefined({ isOpen, defaultOpen, onOpenChange })}>
      {children}
      <HeroTooltip.Content
        placement={reactAriaPlacementOf(placement, align)}
        {...omitUndefined({ showArrow: hasArrow })}
      >
        {hasArrow ? <HeroTooltip.Arrow /> : null}
        {shortcut === undefined ? (
          content
        ) : (
          // The words, a rule, then the keys as their own image with the spoken name ("G then O"), so they never
          // run into the words. Spoken here: a chord has no `aria-keyshortcuts` on the element to carry them.
          <span className="inline-flex items-center gap-2">
            <span>{content}</span>
            <span
              aria-hidden
              data-slot="tooltip-separator"
              className="h-3.5 w-px shrink-0 self-center bg-current opacity-40"
            />
            <ShortcutHint keys={shortcut} />
          </span>
        )}
      </HeroTooltip.Content>
    </HeroTooltip>
  );
}
