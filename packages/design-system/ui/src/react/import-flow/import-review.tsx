/**
 * Stackra file contract:
 * Purpose: the web `ImportReview`: the counts of a dry run or an import (created, updated, skipped when given, refused)
 *          as stats in a live region, labelled for what would happen or, once `isDone`, what did; then its problems
 *          by row, or a line saying there are none.
 * Boundary: internal: the review step of `ImportFlow` and the review and summary steps of `ImportDialog`.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 1.3.1 and 4.1.3; STA-1371.
 */
import type { ReactElement } from "react";

import { IMPORT_DIALOG_KEYS } from "#core/constants/import-dialog-keys.constant";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import type { ImportReviewProps } from "#react/import-flow/import-review.props";
import { Stat } from "#react/stat/stat";

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
  const hasSkipped = result.skipped !== undefined;
  return (
    <>
      {/* A query container: four across once the step itself is wide enough, not the window. */}
      <div className="@container">
        <div
          role="status"
          className={
            hasSkipped ? "grid grid-cols-2 gap-4 @lg:grid-cols-4" : "grid grid-cols-3 gap-4"
          }
        >
          <Stat label={t(isDone ? D.done_created : K.created)} value={result.created} />
          <Stat label={t(isDone ? D.done_updated : K.updated)} value={result.updated} />
          {hasSkipped ? (
            <Stat label={t(isDone ? D.done_skipped : D.skipped)} value={result.skipped ?? 0} />
          ) : null}
          <Stat label={t(isDone ? D.done_failed : K.failed)} value={result.failed} />
        </div>
      </div>
      {result.issues.length > 0 ? (
        <section aria-label={t(K.issues)} className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="m-0 text-sm font-semibold">{t(K.issues)}</h3>
            {issuesAction}
          </div>
          <ul className="m-0 flex max-h-56 list-none flex-col divide-y divide-separator overflow-y-auto rounded-[var(--radius-control)] border border-separator p-0">
            {result.issues.map((issue) => (
              <li
                key={`${issue.row}:${issue.field}:${issue.message}`}
                className="flex gap-3 px-3 py-2 text-sm"
              >
                <span className="shrink-0 text-muted tabular-nums">
                  {t(K.row, { row: issue.row })}
                </span>
                <span className="shrink-0 font-medium">{issue.field}</span>
                <span className="text-danger">{issue.message}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p className="m-0 text-sm text-success">{t(K.no_issues)}</p>
      )}
    </>
  );
}
