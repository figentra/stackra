/**
 * Stackra file contract:
 * Purpose: the native `Result`: the outcome of an action on the shared StateLayout (icon, title, description, actions),
 *          the icon in the status's tone disc: a check for success, an alert for error, an info mark, or a spinner
 *          while pending.
 * Boundary: a pending result is a polite live region, so its change to success or error is announced on Android and
 *           read on focus on iOS; the icon is decoration.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 1.4.1 and 4.1.3; STA-1371.
 */
import type { ReactElement } from "react";
import { View } from "react-native";

import { MARKER_TONE_CLASS_NAME } from "#core/constants/marker-tone-class-name.constant";
import { RESULT_TONE } from "#core/constants/result-tone.constant";
import { FeedbackIcon } from "#native/feedback-icon/feedback-icon";
import type { ResultProps } from "#native/result/result.props";
import { Spinner } from "#native/spinner/spinner";
import { StateLayout } from "#native/state-layout/state-layout";

/** The outcome of an action. */
export function Result({
  status,
  icon,
  headingLevel = 2,
  className,
  ...rest
}: ResultProps): ReactElement {
  const tone = RESULT_TONE[status];
  return (
    <StateLayout
      {...rest}
      accessibilityLiveRegion="polite"
      headingLevel={headingLevel}
      defaultIcon="circle-check"
      {...(className ? { className } : {})}
      icon={
        icon === false ? (
          false
        ) : (
          <View
            importantForAccessibility="no-hide-descendants"
            className={`size-12 items-center justify-center rounded-[var(--radius-pill)] ${MARKER_TONE_CLASS_NAME[tone]}`}
          >
            {status === "pending" ? (
              <Spinner />
            ) : (
              <FeedbackIcon tone={tone} {...(icon ? { icon } : {})} />
            )}
          </View>
        )
      }
    />
  );
}
