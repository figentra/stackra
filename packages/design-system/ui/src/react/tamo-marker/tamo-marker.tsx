/**
 * Stackra file contract:
 * Purpose: the web `TamoMarker`: the AI-made marker, Tamo's mark and "Made with Tamo" on content Tamo made, or a
 *          warning-toned "Filled by Tamo, check it" on a field Tamo filled that the person has not checked.
 * Boundary: a label only; whether content is Tamo's is the caller's record (ADR 0360 decision 11's provenance).
 * Runtime: browser
 * Governing contract: ADR 0507; ADR 0360 (decision 11: the AI marker); WCAG 2.2 SC 1.4.1 (the words, not the colour).
 */
import { cn } from "@heroui/react";
import type { ReactElement } from "react";

import { TAMO_KEYS } from "#core/constants/tamo-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import { TamoMark } from "#react/tamo-mark/tamo-mark";
import type { TamoMarkerProps } from "#react/tamo-marker/tamo-marker.props";

/** The AI-made marker. */
export function TamoMarker({
  needsReview = false,
  label,
  className,
}: TamoMarkerProps): ReactElement {
  const t = useUiText();
  return (
    <span
      data-slot="tamo-marker"
      data-review={needsReview || undefined}
      className={
        cn(
          "inline-flex w-fit items-center gap-1 rounded-[var(--radius-pill)] px-2 py-0.5 text-xs font-medium",
          needsReview
            ? "bg-warning-soft text-warning-soft-foreground"
            : "bg-default text-[var(--tamo-name)]",
          className,
        ) ?? ""
      }
    >
      <TamoMark size="sm" />
      {label ?? t(needsReview ? TAMO_KEYS.ui.tamo.review : TAMO_KEYS.ui.tamo.made)}
    </span>
  );
}
