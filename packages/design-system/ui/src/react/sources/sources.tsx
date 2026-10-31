/**
 * Stackra file contract:
 * Purpose: the web `Sources`: an answer's citations behind a quiet "3 sources" toggle with up to three stacked marks
 *          (favicons or letters); open, the `SourceChip`s wrap onto lines 8 px apart.
 * Boundary: the kit's Disclosure (a button with `aria-expanded` controlling the panel); the chips are a list named
 *           "Sources". The stacked marks are decorative. Logical spacing, so the stack overlaps toward the reading end in
 *           Arabic.
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
import { SourceChip } from "#react/sources/source-chip";
import { SourceMark } from "#react/sources/source-mark";
import type { SourcesProps } from "#react/sources/sources.props";

/** The list's words. */
const K = AI_PARTS_KEYS.ui.sources;

/** An answer's citations, folded. */
export function Sources({
  sources,
  summary,
  isExpanded,
  defaultExpanded,
  onExpandedChange,
  className,
}: SourcesProps): ReactElement {
  const t = useUiText();
  return (
    <Disclosure
      title={
        <span className="flex items-center gap-2 text-xs font-medium text-muted">
          <span aria-hidden="true" className="flex -space-x-1">
            {sources.slice(0, 3).map((source) => (
              <SourceMark key={source.key} source={source} />
            ))}
          </span>
          {summary ?? t(K.count, { count: sources.length })}
        </span>
      }
      className={cn("w-fit max-w-full", className) ?? ""}
      {...omitUndefined({ isExpanded, defaultExpanded, onExpandedChange })}
    >
      <ul aria-label={t(K.label)} className="m-0 flex list-none flex-wrap gap-2 p-0">
        {sources.map((source) => (
          <li key={source.key} className="flex">
            <SourceChip source={source} />
          </li>
        ))}
      </ul>
    </Disclosure>
  );
}
