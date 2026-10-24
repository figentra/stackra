/**
 * Stackra file contract:
 * Purpose: the web `Tooltip` on HeroUI v3's Tooltip: one component that takes the element it describes and the text,
 *          and draws HeroUI's root, content and arrow. It maps the shared contract (`placement` and `align` to React
 *          Aria's placement string, `hasArrow` to `showArrow`) and passes every other HeroUI root prop through, such as
 *          `delay`, `closeDelay` and `isDisabled`.
 * Boundary: no styling of its own. React Aria shows the tooltip on hover and on keyboard focus only, hides it on
 *           Escape, keeps it open while the pointer is over it (WCAG 1.4.13) and names it as the element's
 *           description, never its name.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0312; ADR 0165 (HeroUI v3 on web); WCAG 2.2
 *          SC 1.4.13, 4.1.2.
 */
import { Tooltip as HeroTooltip, type TooltipRootProps } from "@heroui/react";
import type { ReactElement } from "react";

import type { TooltipContractProps } from "#contracts/types/tooltip-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { reactAriaPlacementOf } from "#core/functions/react-aria-placement-of.function";

/** Props of the web Tooltip: the shared contract plus HeroUI v3's own tooltip root props, passed through. */
export type TooltipProps = TooltipContractProps &
  Omit<TooltipRootProps, keyof TooltipContractProps>;

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
        {content}
      </HeroTooltip.Content>
    </HeroTooltip>
  );
}
