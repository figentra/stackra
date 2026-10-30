/**
 * Stackra file contract:
 * Purpose: the web `ContextualHelp`: a ghost `IconButton` (a question mark for `help`, an "i" for `info`) named by
 *          `label`, that opens a `Popover` of help with the popover's own enter and exit motion. Without a `title` the
 *          popover is named by `label`. Every other Popover prop passes through.
 * Boundary: builds on `#react/popover/popover` and `#react/icon-button/icon-button`; adds no behaviour. React Aria
 *           opens it on press or Enter, closes it on Escape or a press outside and returns focus to the button, and
 *           places it by the reading direction.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0312; design-system gap inventory row 36; WCAG 2.2 SC 1.3.1, 2.1.1,
 *          4.1.2.
 */
import type { ReactElement } from "react";
import { CircleQuestionMark } from "@stackra/icons/react/lucide-icons";

import { IconButton } from "#react/icon-button/icon-button";
import { Popover } from "#react/popover/popover";
import type { ContextualHelpProps } from "#react/contextual-help/contextual-help.props";

/** A "?" or "i" button beside a field or heading that opens a short explanation. */
export function ContextualHelp({
  label,
  children,
  title,
  variant = "help",
  size = "sm",
  ...rest
}: ContextualHelpProps): ReactElement {
  return (
    <Popover
      {...rest}
      {...(title === undefined ? { "aria-label": label } : { title })}
      trigger={
        <IconButton
          label={label}
          variant="ghost"
          size={size}
          icon={variant === "info" ? "info" : <CircleQuestionMark />}
        />
      }
    >
      {children}
    </Popover>
  );
}
