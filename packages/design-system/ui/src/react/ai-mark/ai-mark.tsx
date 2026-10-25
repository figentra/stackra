/**
 * Stackra file contract:
 * Purpose: the web `AiMark`: the sparkles mark beside an AI-capable action, on a record an agent changed, or on
 *          AI-generated content, with its label read out, and shown when asked.
 * Boundary: draws a mark only; whether to draw it is derived by the caller (ADR 0360 decision 11). With the label
 *           hidden the icon carries it as its accessible name; shown, the icon is decorative and the text is read.
 * Runtime: browser
 * Governing contract: ADR 0360 (decision 11); ADR 0302 (decision 3); WCAG 2.2 SC 1.1.1.
 */
import type { ReactElement } from "react";

import type { AiMarkContractProps } from "#contracts/types/ai-mark-contract-props.type";
import { Icon } from "#react/icon/icon";

/** Props of the web AiMark. */
export type AiMarkProps = AiMarkContractProps;

/** The AI mark, labelled. */
export function AiMark({ kind, label, isLabelVisible, size = "sm" }: AiMarkProps): ReactElement {
  return (
    <span
      data-slot="ai-mark"
      data-kind={kind}
      className="inline-flex items-center gap-1 text-accent"
    >
      <Icon name="sparkles" size={size} label={isLabelVisible ? undefined : label} />
      {isLabelVisible ? <span className="text-xs">{label}</span> : null}
    </span>
  );
}
