/**
 * Stackra file contract:
 * Purpose: the web `AiMark`: Tamo's mark (ADR 0507 decision 4) beside an AI-capable action, on a record an agent changed, or on
 *          AI-generated content, with its label read out, and shown when asked.
 * Boundary: draws a mark only; whether to draw it is derived by the caller (ADR 0360 decision 11). With the label
 *           hidden the icon carries it as its accessible name; shown, the icon is decorative and the text is read.
 * Runtime: browser
 * Governing contract: ADR 0360 (decision 11); ADR 0302 (decision 3); ADR 0507 (decision 4); WCAG 2.2 SC 1.1.1.
 */
import type { ReactElement } from "react";

import { TamoMark } from "#react/tamo-mark/tamo-mark";
import type { AiMarkProps } from "#react/ai-mark/ai-mark.props";

/** The AI mark, labelled. */
export function AiMark({ kind, label, isLabelVisible, size = "sm" }: AiMarkProps): ReactElement {
  return (
    <span
      data-slot="ai-mark"
      data-kind={kind}
      className="inline-flex items-center gap-1 text-[var(--tamo-name)]"
    >
      <TamoMark size={size} {...(isLabelVisible ? {} : { label })} />
      {isLabelVisible ? <span className="text-xs">{label}</span> : null}
    </span>
  );
}
