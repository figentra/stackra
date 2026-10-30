/**
 * Stackra file contract:
 * Purpose: the native `ImportReview`: the counts of a dry run or an import (created, updated, skipped when given,
 *          refused) as stats in a polite live region, labelled for what would happen or, once `isDone`, what did; then
 *          its problems by row, or a line saying there are none.
 * Boundary: internal: the review step of the native `ImportFlow` and the review and summary of `ImportDialog`.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371.
 */
import type { ReactElement } from "react";
import { View } from "react-native";

import { IMPORT_DIALOG_KEYS } from "#core/constants/import-dialog-keys.constant";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import type { ImportReviewProps } from "#native/import-flow/import-review.props";
import { Stat } from "#native/stat/stat";
import { Text } from "#native/text/text";

/** The words' keys. */
const K = UI_KEYS.ui.import_flow;
/** The dialog's words: the summary's past-tense labels. */
const D = IMPORT_DIALOG_KEYS.ui.import_dialog;

/** What an import would do, or did. */
export function ImportReview({
  result,
  issuesAction,
  isDone = false,
}: ImportReviewProps): ReactElement {
  const t = useUiText();
  const stats = [
    { label: t(isDone ? D.done_created : K.created), value: result.created },
    { label: t(isDone ? D.done_updated : K.updated), value: result.updated },
    ...(result.skipped === undefined
      ? []
      : [{ label: t(isDone ? D.done_skipped : D.skipped), value: result.skipped }]),
    { label: t(isDone ? D.done_failed : K.failed), value: result.failed },
  ];
  return (
    <>
      <View accessibilityLiveRegion="polite" className="flex-row flex-wrap gap-y-4">
        {stats.map((stat) => (
          <View key={stat.label} className={stats.length > 3 ? "w-1/2 pe-4" : "flex-1 pe-4"}>
            <Stat label={stat.label} value={stat.value} />
          </View>
        ))}
      </View>
      {result.issues.length > 0 ? (
        <View className="gap-1">
          <Text accessibilityRole="header" className="text-sm font-semibold">
            {t(K.issues)}
          </Text>
          {result.issues.map((issue, index) => (
            // oxlint-disable-next-line react/no-array-index-key -- a row can carry several issues, so the issue has no identity but its place in the report
            <View key={index} className="flex-row gap-3 border-b border-separator py-2">
              <Text type="small" tone="muted">
                {t(K.row, { row: issue.row })}
              </Text>
              <Text type="small" className="font-medium">
                {issue.field}
              </Text>
              <Text type="small" tone="danger" className="flex-1">
                {issue.message}
              </Text>
            </View>
          ))}
          {issuesAction}
        </View>
      ) : (
        <Text type="small" tone="success">
          {t(K.no_issues)}
        </Text>
      )}
    </>
  );
}
