/**
 * Stackra file contract:
 * Purpose: the native `FormErrorSummary`: the danger `Alert` shown above a form after a failed submit, headed "There are
 *          3 problems" (or the caller's title), listing each error as a link-role row; pressing one calls
 *          `onSelectError` with its field so the screen focuses that input. When it appears and after each failed
 *          submit, the heading is announced to VoiceOver and TalkBack.
 * Boundary: draws nothing without errors. Native has no element ids, so following a field is the caller's
 *           (`onSelectError`); the summary does not read a form's state. Rows follow the reading direction through
 *           React Native's own right-to-left layout.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0055 (forms); WCAG 2.2 SC 3.3.1 and
 *          3.3.3; STA-1371.
 */
import { type ReactElement, useEffect } from "react";
import { AccessibilityInfo, Pressable, View } from "react-native";

import type { FormErrorItem } from "#contracts/types/form-error-item.type";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import { Alert } from "#native/alert/alert";
import type { FormErrorSummaryProps } from "#native/form-error-summary/form-error-summary.props";
import { Text } from "#native/text/text";

/** The default for unset errors: one stable empty list. */
const NONE: readonly FormErrorItem[] = [];

/** A list of a form's errors, each pressable to reach its field. */
export function FormErrorSummary({
  errors = NONE,
  title,
  submitCount = 0,
  onSelectError,
  className,
}: FormErrorSummaryProps): ReactElement | null {
  const t = useUiText();
  const heading = title ?? t(UI_KEYS.ui.form_error_summary.title, { count: errors.length });
  // -1 while hidden, so the heading is announced when the summary appears and on each new attempt.
  const announceSignal = errors.length > 0 ? submitCount : -1;
  useEffect(() => {
    if (announceSignal >= 0) AccessibilityInfo.announceForAccessibility(heading);
    // The heading follows the count, which changes as fields are fixed; only a new attempt announces again.
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- announce on appearance and on a new attempt only
  }, [announceSignal]);
  if (errors.length === 0) return null;
  return (
    <Alert
      tone="danger"
      title={heading}
      {...(className ? { className } : {})}
      actions={
        <View className="w-full gap-1">
          {errors.map((item) => (
            <Pressable
              key={item.field}
              accessibilityRole="link"
              onPress={() => onSelectError?.(item.field)}
              hitSlop={6}
              className="min-h-8 justify-center"
            >
              <Text type="small" tone="danger" className="underline">
                {item.label ? `${item.label}: ${item.message}` : item.message}
              </Text>
            </Pressable>
          ))}
        </View>
      }
    />
  );
}
