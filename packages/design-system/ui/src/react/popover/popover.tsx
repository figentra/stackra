/**
 * Stackra file contract:
 * Purpose: the web `Popover` on HeroUI v3's Popover: one component that takes a trigger and the content, and draws
 *          HeroUI's root, content, arrow, dialog and heading. It maps the shared contract (`placement` and `align` to
 *          React Aria's placement string, `isDismissable` to its outside-interaction check) and passes every other
 *          HeroUI content prop through.
 * Boundary: no styling of its own; the compound parts of HeroUI are not exposed, so web and native take the same
 *           props. React Aria hides the page behind an open popover from assistive technology and returns focus to the
 *           trigger when it closes. The title is a level-2 heading, as in Modal, because React Aria's default of 3 would
 *           skip a level under a page's `h1`.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0312; ADR 0165 (HeroUI v3 on web); WCAG 2.2
 *          SC 2.1.2, 4.1.2.
 */
import { Popover as HeroPopover } from "@heroui/react";
import type { ReactElement } from "react";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import { reactAriaPlacementOf } from "#core/functions/react-aria-placement-of.function";
import type { PopoverProps } from "#react/popover/popover.props";

/** A press outside is refused: the popover then closes only from inside, by Escape or by a control of its own. */
const REFUSE_OUTSIDE = (): boolean => false;

/**
 * Rich content anchored to a trigger: opens on press or Enter, closes on Escape or a press outside, and returns focus
 * to the trigger. Give it a `title`, or an `aria-label`, so the dialog has a name.
 */
export function Popover({
  trigger,
  children,
  title,
  hasArrow,
  placement = "bottom",
  align,
  isOpen,
  defaultOpen,
  onOpenChange,
  isDismissable = true,
  isKeyboardDismissDisabled,
  "aria-label": ariaLabel,
  ...rest
}: PopoverProps): ReactElement {
  return (
    <HeroPopover {...omitUndefined({ isOpen, defaultOpen, onOpenChange })}>
      {trigger}
      <HeroPopover.Content
        {...rest}
        {...omitUndefined({ isKeyboardDismissDisabled })}
        // The outside check also covers focus moving out, so a step the user must finish stays open until they do.
        {...(isDismissable ? {} : { shouldCloseOnInteractOutside: REFUSE_OUTSIDE })}
        placement={reactAriaPlacementOf(placement, align)}
      >
        {hasArrow ? <HeroPopover.Arrow /> : null}
        <HeroPopover.Dialog {...omitUndefined({ "aria-label": ariaLabel })}>
          {title === undefined ? null : (
            <HeroPopover.Heading level={2}>{title}</HeroPopover.Heading>
          )}
          {children}
        </HeroPopover.Dialog>
      </HeroPopover.Content>
    </HeroPopover>
  );
}
