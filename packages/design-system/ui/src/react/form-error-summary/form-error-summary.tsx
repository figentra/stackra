/**
 * Stackra file contract:
 * Purpose: the web `FormErrorSummary`: the danger `Alert` shown above a form after a failed submit, headed "There are 3
 *          problems" (or the caller's title), listing each error as a link to its field. Following a link scrolls the
 *          field into view and focuses it; the summary itself takes focus when it appears and after each failed submit.
 * Boundary: draws nothing without errors. Errors come from `errors`, or, inside a schema `Form`, from react-hook-form's
 *           field errors and submit count. A field is found by id, then by `name`. Focus moves only on appearance and
 *           on a new `submitCount`, never as the list changes while the reader fixes a field. Scrolling is instant
 *           under prefers-reduced-motion. The list follows the reading direction like any text.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0055 (forms); GOV.UK error summary pattern; WCAG 2.2 SC 2.4.3, 3.3.1
 *          and 3.3.3; STA-1371.
 */
import { cn } from "@heroui/react";
import { useReducedMotion } from "motion/react";
import { type MouseEvent, type ReactElement, useEffect, useRef } from "react";
import { useFormContext } from "react-hook-form";

import type { FormErrorItem } from "#contracts/types/form-error-item.type";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { Alert } from "#react/alert/alert";
import type { FormErrorSummaryProps } from "#react/form-error-summary/form-error-summary.props";
import { useUiText } from "#react/hooks/use-ui-text";

/** A list of a form's errors, each linking to its field. */
export function FormErrorSummary({
  errors,
  title,
  submitCount,
  onSelectError,
  className,
}: FormErrorSummaryProps): ReactElement | null {
  const t = useUiText();
  const isReduced = useReducedMotion() ?? false;
  const boxRef = useRef<HTMLDivElement>(null);
  // Null outside a schema form; reading `errors` subscribes the form to them.
  const form = useFormContext() as ReturnType<typeof useFormContext> | null;
  const items: readonly FormErrorItem[] =
    errors ??
    Object.entries(form?.formState.errors ?? {}).flatMap(([field, error]) =>
      typeof error?.message === "string" && error.message
        ? [{ field, message: error.message }]
        : [],
    );
  const attempt = submitCount ?? form?.formState.submitCount ?? 0;
  // -1 while hidden, so the summary is focused when it appears and on each new attempt.
  const focusSignal = items.length > 0 ? attempt : -1;
  useEffect(() => {
    if (focusSignal >= 0) boxRef.current?.focus();
  }, [focusSignal]);

  if (items.length === 0) return null;
  const follow = (field: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const target =
      document.getElementById(field) ??
      document.querySelector<HTMLElement>(`[name="${CSS.escape(field)}"]`);
    target?.scrollIntoView({ block: "center", behavior: isReduced ? "auto" : "smooth" });
    target?.focus({ preventScroll: true });
    onSelectError?.(field);
  };
  return (
    <div
      ref={boxRef}
      tabIndex={-1}
      data-slot="form-error-summary"
      className={cn(
        "rounded-[var(--radius-container)] outline-none focus-visible:outline-2 focus-visible:outline-focus",
        className,
      )}
    >
      <Alert
        tone="danger"
        title={title ?? t(UI_KEYS.ui.form_error_summary.title, { count: items.length })}
        actions={
          <ul className="m-0 flex w-full list-none flex-col gap-1 p-0">
            {items.map((item) => (
              <li key={item.field}>
                <a
                  href={`#${item.field}`}
                  onClick={follow(item.field)}
                  className="text-sm text-danger underline underline-offset-2 outline-none hover:no-underline focus-visible:rounded-[var(--radius-control-inner)] focus-visible:outline-2 focus-visible:outline-focus"
                >
                  {item.label ? `${item.label}: ${item.message}` : item.message}
                </a>
              </li>
            ))}
          </ul>
        }
      />
    </div>
  );
}
