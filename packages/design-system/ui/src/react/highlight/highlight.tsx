/**
 * Stackra file contract:
 * Purpose: the web `Highlight`: a text with the search terms marked (`<mark>`), matched ignoring case, Arabic
 *          diacritics, tatweel and letter variants (`highlightPartsOf`).
 * Boundary: the text is never changed, reordered or reversed; a mark only paints a background, with no padding,
 *           border, letter spacing or weight change, so Arabic letters stay joined across its edges and diacritics stay
 *           on their letters. Screen readers read the text as one.
 * Runtime: browser
 * Governing contract: ADR 0060 (Arabic rendering rules); WCAG 2.2 SC 1.4.3; STA-1371.
 */
import { cn } from "@heroui/react";
import type { ReactElement } from "react";

import { highlightPartsOf } from "#core/functions/highlight-parts-of.function";
import type { HighlightProps } from "#react/highlight/highlight.props";

/** A text with its search terms marked. */
export function Highlight({ children, query, className }: HighlightProps): ReactElement {
  return (
    <span data-slot="highlight" className={className}>
      {highlightPartsOf(children, query).map((part, index) =>
        part.isMatch ? (
          // No padding or weight: either would break the shaping of an Arabic word across the mark's edge.
          // oxlint-disable-next-line react/no-array-index-key -- the parts are cut from the text in order; a part repeats when a term does
          <mark key={index} className={cn("rounded-none bg-warning/30 p-0 text-inherit")}>
            {part.text}
          </mark>
        ) : (
          part.text
        ),
      )}
    </span>
  );
}
