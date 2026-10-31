/**
 * Stackra file contract:
 * Purpose: the web `Reasoning`: the assistant's reasoning and agent steps behind a quiet trigger ("Thought for 4s",
 *          muted, no chrome) that shimmers while it runs; open, a vertical trace of steps, each a dot on a line with an
 *          optional label above its body. Steps may hold nested traces, file rows or images.
 * Boundary: the kit's Disclosure (a button with `aria-expanded` controlling the panel) and Shimmer; the steps are an
 *           ordered list named "Reasoning steps". The line and padding are logical, so the trace sits on the right in
 *           Arabic. It depends on no AI SDK.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WAI-ARIA 1.2 disclosure pattern; STA-1371
 *          (component gaps, owner approval 2026-10-31).
 */
import { cn } from "@heroui/react";
import type { ReactElement } from "react";

import { AI_PARTS_KEYS } from "#core/constants/ai-parts-keys.constant";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { Disclosure } from "#react/disclosure/disclosure";
import { useUiText } from "#react/hooks/use-ui-text";
import type { ReasoningProps } from "#react/reasoning/reasoning.props";
import { Shimmer } from "#react/shimmer/shimmer";

/** The trace's words. */
const K = AI_PARTS_KEYS.ui.reasoning;

/** The assistant's reasoning, folded. */
export function Reasoning({
  steps,
  summary,
  isStreaming = false,
  isExpanded,
  defaultExpanded,
  onExpandedChange,
  className,
}: ReasoningProps): ReactElement {
  const t = useUiText();
  return (
    <Disclosure
      title={
        isStreaming ? (
          <Shimmer>{summary}</Shimmer>
        ) : (
          <span className="text-sm text-muted">{summary ?? t(K.summary)}</span>
        )
      }
      className={cn("w-fit max-w-full", className) ?? ""}
      {...omitUndefined({ isExpanded, defaultExpanded, onExpandedChange })}
    >
      <ol
        aria-label={t(K.steps)}
        data-slot="reasoning-steps"
        className="m-0 grid list-none gap-2 border-s border-separator ps-3"
      >
        {steps.map((step) => (
          <li
            key={step.key}
            className="relative grid gap-1 text-sm leading-relaxed text-foreground"
          >
            <span
              aria-hidden="true"
              className="absolute top-2 -start-3.75 size-1.5 rounded-[var(--radius-pill)] bg-muted"
            />
            {step.label ? <span className="font-medium text-muted">{step.label}</span> : null}
            <div>{step.content}</div>
          </li>
        ))}
      </ol>
    </Disclosure>
  );
}
