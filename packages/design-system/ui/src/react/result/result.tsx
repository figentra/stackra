/**
 * Stackra file contract:
 * Purpose: the web `Result`: the outcome of an action on the shared StateLayout (icon, title, description, actions),
 *          the icon in the status's tone disc: a check for success, an alert for error, an info mark, or a spinner
 *          while pending.
 * Boundary: the title is a heading at `headingLevel` (default 2). A pending result is a polite live region, so its
 *           change to success or error is announced; the icon is decoration.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 1.3.1, 1.4.1 and 4.1.3; STA-1371.
 */
import { cn } from "@heroui/react";
import type { ReactElement } from "react";

import { MARKER_TONE_CLASS_NAME } from "#core/constants/marker-tone-class-name.constant";
import { RESULT_TONE } from "#core/constants/result-tone.constant";
import { FeedbackIcon } from "#react/feedback-icon/feedback-icon";
import type { ResultProps } from "#react/result/result.props";
import { Spinner } from "#react/spinner/spinner";
import { StateLayout } from "#react/state-layout/state-layout";

/** The outcome of an action. */
export function Result({ status, icon, headingLevel = 2, className, ...rest }: ResultProps): ReactElement {
  const tone = RESULT_TONE[status];
  return (
    <StateLayout
      {...rest}
      aria-live="polite"
      data-status={status}
      headingLevel={headingLevel}
      defaultIcon="circle-check"
      className={className}
      icon={
        icon === false ? (
          false
        ) : (
          <span
            aria-hidden
            className={cn(
              "flex size-12 items-center justify-center rounded-full [&_svg]:size-6",
              MARKER_TONE_CLASS_NAME[tone],
            )}
          >
            {status === "pending" ? <Spinner size="md" /> : <FeedbackIcon tone={tone} {...(icon ? { icon } : {})} />}
          </span>
        )
      }
    />
  );
}
