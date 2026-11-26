/**
 * Stackra file contract:
 * Purpose: the web `ApprovalCard`: a tool call that waits for a person, with what will run, its input, its risk, and
 *          Approve and Deny while requested; once answered or expired, one status line (and a denied call's reason).
 * Boundary: a named region; it runs nothing: the host answers the run from `onApprove` or `onDeny` (ADR 0021). Each
 *           value keeps its own direction through the property list, so an Arabic value reads right to left.
 * Runtime: browser
 * Governing contract: ADR 0507 (Ask Tamo: AI slots in the design system); ADR 0021 (a write waits for a person);
 *          WCAG 2.2 SC 1.3.1, 2.1.1, 4.1.3.
 */
import { cn } from "@heroui/react";
import type { ReactElement } from "react";

import { TAMO_KEYS } from "#core/constants/tamo-keys.constant";
import type { ApprovalCardProps } from "#react/approval-card/approval-card.props";
import { Button } from "#react/button/button";
import { Chip } from "#react/chip/chip";
import { useUiText } from "#react/hooks/use-ui-text";
import { PropertyList } from "#react/property-list/property-list";
import { TamoMark } from "#react/tamo-mark/tamo-mark";

/** K: the Tamo words. */
const K = TAMO_KEYS.ui.tamo;

/** The status line's word for each answered state. */
const STATUS_KEY = Object.freeze({
  approved: K.approved,
  denied: K.denied,
  expired: K.expired,
} as const);

/** A tool call Tamo wants to run, for the person to approve or deny. */
export function ApprovalCard({
  title,
  fields,
  risk,
  status,
  onApprove,
  onDeny,
  isPending = false,
  reason,
  className,
}: ApprovalCardProps): ReactElement {
  const t = useUiText();
  const heading = title ?? t(K.approval_title);
  return (
    <section
      aria-label={heading}
      data-slot="approval-card"
      data-status={status}
      className={
        cn(
          "grid gap-3 rounded-[var(--radius-container)] border border-separator bg-surface p-3",
          className,
        ) ?? ""
      }
    >
      <header className="flex items-center gap-2 text-sm font-medium">
        <TamoMark size="sm" />
        <span className="min-w-0 flex-1">{heading}</span>
        {risk === undefined ? null : (
          <Chip size="sm" tone="warning">
            {t(K.risk, { level: risk })}
          </Chip>
        )}
      </header>
      {fields.length === 0 ? null : (
        <PropertyList
          items={fields.map((field, index) => ({
            id: String(index),
            label: field.label,
            value: field.value,
          }))}
        />
      )}
      {status === "requested" ? (
        <>
          <p className="m-0 text-sm text-muted">{t(K.approval_waiting)}</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" isDisabled={isPending} onPress={onApprove}>
              {t(K.approve)}
            </Button>
            <Button size="sm" variant="secondary" isDisabled={isPending} onPress={onDeny}>
              {t(K.deny)}
            </Button>
          </div>
        </>
      ) : (
        <div role="status" className="grid gap-1 text-sm">
          <span className="font-medium">{t(STATUS_KEY[status])}</span>
          {status === "denied" && reason ? (
            <span dir="auto" className="text-muted">
              {reason}
            </span>
          ) : null}
        </div>
      )}
    </section>
  );
}
