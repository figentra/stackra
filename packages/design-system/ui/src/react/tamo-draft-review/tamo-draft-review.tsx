/**
 * Stackra file contract:
 * Purpose: the web `TamoDraftReview`: the text before and Tamo's draft after, with Accept, Edit (the draft becomes
 *          an editable area, then Accept takes the edit) and Discard; working, a shimmer and Stop; on error, the
 *          message and Try again.
 * Boundary: a named region; nothing reaches the field until Accept (ADR 0021). Each text keeps its own direction
 *           (`dir="auto"`), so an Arabic draft reads right to left in an English screen and back.
 * Runtime: browser
 * Governing contract: ADR 0507 (the draft review); ADR 0021 (AI drafts, the person applies); WCAG 2.2 SC 1.3.1,
 *          2.1.1, 4.1.3.
 */
import { cn, Label, TextArea as HeroTextArea, TextField as HeroTextField } from "@heroui/react";
import { useState, type ReactElement } from "react";

import { TAMO_KEYS } from "#core/constants/tamo-keys.constant";
import { Button } from "#react/button/button";
import { useUiText } from "#react/hooks/use-ui-text";
import { Shimmer } from "#react/shimmer/shimmer";
import { TamoMark } from "#react/tamo-mark/tamo-mark";
import { TamoStatusLine } from "#react/tamo-status-line/tamo-status-line";
import type { TamoDraftReviewProps } from "#react/tamo-draft-review/tamo-draft-review.props";

/** K: the Tamo words. */
const K = TAMO_KEYS.ui.tamo;

/** Tamo's draft beside the text it would replace. */
export function TamoDraftReview({
  before,
  after,
  status = "ready",
  onAccept,
  onDiscard,
  onStop,
  onRetry,
  title,
  className,
}: TamoDraftReviewProps): ReactElement {
  const t = useUiText();
  const heading = title ?? t(K.after);
  const [edited, setEdited] = useState<string | null>(null);
  return (
    <section
      aria-label={heading}
      data-slot="tamo-draft-review"
      data-status={status}
      className={
        cn(
          "grid gap-3 rounded-[var(--radius-container)] border border-separator bg-surface p-3",
          className,
        ) ?? ""
      }
    >
      <header className="flex items-center gap-2 text-sm font-medium">
        <TamoMark size="sm" status={status} />
        <span>{heading}</span>
      </header>
      {status === "working" ? (
        <>
          <Shimmer kind="block" lines={2} />
          <TamoStatusLine status="working" onStop={onStop} />
        </>
      ) : status === "error" ? (
        <TamoStatusLine status="error" onRetry={onRetry} />
      ) : (
        <>
          {before.trim() === "" ? null : (
            <div className="grid gap-1">
              <span className="text-xs font-medium text-muted">{t(K.before)}</span>
              <p dir="auto" className="m-0 whitespace-pre-wrap text-sm text-muted">
                {before}
              </p>
            </div>
          )}
          <div className="grid gap-1">
            {edited === null ? (
              <>
                <span className="text-xs font-medium text-muted">{t(K.after)}</span>
                <p dir="auto" className="m-0 whitespace-pre-wrap text-sm">
                  {after}
                </p>
              </>
            ) : (
              <HeroTextField value={edited} onChange={setEdited} fullWidth>
                <Label>{t(K.after)}</Label>
                <HeroTextArea dir="auto" rows={4} />
              </HeroTextField>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onPress={() => onAccept(edited ?? after)}>
              {t(K.accept)}
            </Button>
            {edited === null ? (
              <Button size="sm" variant="secondary" onPress={() => setEdited(after)}>
                {t(K.edit)}
              </Button>
            ) : null}
            <Button size="sm" variant="ghost" onPress={onDiscard}>
              {t(K.discard)}
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
