/**
 * Stackra file contract:
 * Purpose: the web `TamoGhostText`: Tamo's suggestion drawn in muted text under the field, in normal flow, with
 *          its key hint; Tab accepts it, Escape dismisses it, and a live region reads it with those keys.
 * Boundary: the field stays the person's: the drawn copy is decorative (`aria-hidden`) and nothing changes until
 *           Tab. Each text keeps its own direction (`dir="auto"`), so it reads right in either locale.
 * Runtime: browser
 * Governing contract: ADR 0507 (ghost suggestion text); ADR 0021; WCAG 2.2 SC 2.1.1, 4.1.3.
 */
import { cn } from "@heroui/react";
import type { KeyboardEvent, ReactElement } from "react";

import { TAMO_KEYS } from "#core/constants/tamo-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import type { TamoGhostTextProps } from "#react/tamo-ghost-text/tamo-ghost-text.props";

/** K: the Tamo words. */
const K = TAMO_KEYS.ui.tamo;

/** Tamo's suggestion under a field. */
export function TamoGhostText({
  children,
  value,
  suggestion,
  onAccept,
  onDismiss,
  className,
}: TamoGhostTextProps): ReactElement {
  const t = useUiText();

  const onKeyDownCapture = (event: KeyboardEvent<HTMLDivElement>) => {
    const isField =
      event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement;
    if (suggestion === "" || !isField) return;
    if (event.key === "Tab" && !event.shiftKey) {
      event.preventDefault();
      onAccept(value + suggestion);
    } else if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      onDismiss();
    }
  };

  return (
    // oxlint-disable-next-line jsx-a11y/no-static-element-interactions -- reason: the keys reach the field inside; the wrapper only listens on their way
    <div
      data-slot="tamo-ghost-text"
      className={cn("grid gap-1", className) ?? ""}
      onKeyDownCapture={onKeyDownCapture}
    >
      {children}
      {suggestion === "" ? null : (
        // In normal flow under the field, never over it: an overlay hides the field's text from contrast checks
        // and drifts off-line when the field scrolls. The status below reads it, so this copy is hidden.
        <p aria-hidden className="m-0 flex flex-wrap items-baseline gap-x-2 text-sm text-muted">
          <bdi dir="auto" className="whitespace-pre-wrap">{`…${suggestion}`}</bdi>
          <span className="text-xs">{t(K.ghost_hint)}</span>
        </p>
      )}
      <span role="status" className="sr-only">
        {suggestion === "" ? "" : t(K.suggestion, { text: suggestion })}
      </span>
    </div>
  );
}
