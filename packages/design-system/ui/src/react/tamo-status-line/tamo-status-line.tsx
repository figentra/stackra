/**
 * Stackra file contract:
 * Purpose: the web `TamoStatusLine`: the one state line of every Tamo part: working (the shimmer words and Stop),
 *          error (the message and Try again); nothing while idle or ready.
 * Boundary: a polite live region, so the change is read without moving focus.
 * Runtime: browser
 * Governing contract: ADR 0507 (one working, stop, retry and error set); WCAG 2.2 SC 4.1.3.
 */
import { cn } from "@heroui/react";
import type { ReactElement } from "react";

import { TAMO_KEYS } from "#core/constants/tamo-keys.constant";
import { Button } from "#react/button/button";
import { useUiText } from "#react/hooks/use-ui-text";
import { Shimmer } from "#react/shimmer/shimmer";
import { TamoMark } from "#react/tamo-mark/tamo-mark";
import type { TamoStatusLineProps } from "#react/tamo-status-line/tamo-status-line.props";

/** K: the Tamo words. */
const K = TAMO_KEYS.ui.tamo;

/** Tamo's working and error line. */
export function TamoStatusLine({
  status,
  onStop,
  onRetry,
  errorMessage,
  workingLabel,
  className,
}: TamoStatusLineProps): ReactElement {
  const t = useUiText();
  return (
    <div
      role="status"
      aria-live="polite"
      data-slot="tamo-status"
      data-status={status}
      className={
        cn(
          "flex flex-wrap items-center gap-2 text-sm",
          // Idle or ready, the live region stays, empty and with no height, so a change is still read.
          status === "working" || status === "error" ? "min-h-8" : "",
          className,
        ) ?? ""
      }
    >
      {status === "working" ? (
        <>
          <TamoMark size="sm" status="working" />
          <Shimmer>{workingLabel ?? t(K.working)}</Shimmer>
          {onStop ? (
            <Button size="sm" variant="ghost" startIcon="square" onPress={onStop}>
              {t(K.stop)}
            </Button>
          ) : null}
        </>
      ) : null}
      {status === "error" ? (
        <>
          <TamoMark size="sm" status="error" />
          <span className="text-danger">{errorMessage ?? t(K.error)}</span>
          {onRetry ? (
            <Button size="sm" variant="secondary" startIcon="rotate-ccw" onPress={onRetry}>
              {t(K.retry)}
            </Button>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
