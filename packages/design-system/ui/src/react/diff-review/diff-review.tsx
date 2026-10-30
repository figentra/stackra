/**
 * Stackra file contract:
 * Purpose: the web `DiffReview`: one row per change with what changes, the old value struck through and the new one
 *          after an arrow, and an accept / reject pair; a header counts what is left and accepts all; apply waits until
 *          every change has an answer.
 * Boundary: controlled; values are isolated (`bdi`) so numbers and Latin names keep their order in Arabic, and the
 *           arrow mirrors. Answers are read as words, not colour alone.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WCAG 2.2 SC 1.4.1 and 4.1.2; STA-1371.
 */
import { cn } from "@heroui/react";
import type { ReactElement } from "react";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { Button } from "#react/button/button";
import type { DiffReviewProps } from "#react/diff-review/diff-review.props";
import { useUiText } from "#react/hooks/use-ui-text";
import { Icon } from "#react/icon/icon";

/** The words' keys. */
const K = UI_KEYS.ui.diff_review;

/** A change set to accept or reject. */
export function DiffReview({
  changes,
  decisions,
  onDecisionsChange,
  onApply,
  label,
  className,
}: DiffReviewProps): ReactElement {
  const t = useUiText();
  const pending = changes.filter((change) => decisions[change.id] === undefined).length;
  const decide = (id: string, answer: "accepted" | "rejected") =>
    onDecisionsChange({ ...decisions, [id]: answer });
  return (
    <section
      aria-label={label}
      data-slot="diff-review"
      className={cn("flex flex-col gap-3", className)}
    >
      <div className="flex items-center justify-between gap-2">
        <span role="status" className="text-sm text-muted">
          {t(K.pending, { count: pending })}
        </span>
        <Button
          size="sm"
          variant="ghost"
          startIcon="check-check"
          isDisabled={pending === 0}
          onPress={() =>
            onDecisionsChange(
              Object.fromEntries(
                changes.map((change) => [change.id, decisions[change.id] ?? "accepted"]),
              ),
            )
          }
        >
          {t(K.accept_all)}
        </Button>
      </div>
      <ul className="@container m-0 flex list-none flex-col divide-y divide-separator rounded-xl border border-separator p-0">
        {changes.map((change) => {
          const answer = decisions[change.id];
          return (
            <li
              key={change.id}
              className={cn(
                "flex flex-col gap-2 p-3 @lg:flex-row @lg:items-center",
                answer === "rejected" && "opacity-60",
              )}
            >
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-xs font-medium text-muted">{change.label}</span>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="sr-only">{t(K.before)}</span>
                  <bdi className="rounded bg-danger/10 px-1 text-muted line-through">
                    {change.before ?? t(K.not_set)}
                  </bdi>
                  <Icon name="arrow-right" size="sm" tone="muted" />
                  <span className="sr-only">{t(K.after)}</span>
                  <bdi className="rounded bg-success/10 px-1 font-medium">
                    {change.after ?? t(K.not_set)}
                  </bdi>
                </div>
              </div>
              <div role="group" aria-label={change.label} className="flex shrink-0 gap-1">
                <Button
                  size="sm"
                  variant={answer === "accepted" ? "primary" : "secondary"}
                  startIcon="check"
                  aria-pressed={answer === "accepted"}
                  onPress={() => decide(change.id, "accepted")}
                >
                  {answer === "accepted" ? t(K.accepted) : t(K.accept)}
                </Button>
                <Button
                  size="sm"
                  variant={answer === "rejected" ? "danger" : "ghost"}
                  startIcon="x"
                  aria-pressed={answer === "rejected"}
                  onPress={() => decide(change.id, "rejected")}
                >
                  {answer === "rejected" ? t(K.rejected) : t(K.reject)}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
      {onApply ? (
        <div className="flex justify-end">
          <Button isDisabled={pending > 0} onPress={() => onApply(decisions)}>
            {t(K.apply)}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
