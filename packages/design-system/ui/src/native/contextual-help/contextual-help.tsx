/**
 * Stackra file contract:
 * Purpose: the native `ContextualHelp`: a ghost `IconButton` (a question mark for `help`, an "i" for `info`) named by
 *          `label`, that opens a `Popover` of help with HeroUI Native's own popover motion; the press plays the light
 *          haptic every Button plays. Every other Popover prop passes through.
 * Boundary: builds on `#native/popover/popover` and `#native/icon-button/icon-button`; adds no behaviour. Without a
 *           `title` the popover has no heading, and the button's label is what VoiceOver and TalkBack read first.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0312; design-system gap inventory row 36.
 */
import { CircleQuestionMark } from "@stackra/icons/native/lucide-icons";
import type { ReactElement } from "react";

import { IconButton } from "#native/icon-button/icon-button";
import { Popover } from "#native/popover/popover";
import type { ContextualHelpProps } from "#native/contextual-help/contextual-help.props";

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
      {...(title === undefined ? {} : { title })}
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
