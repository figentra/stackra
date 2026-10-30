/**
 * Stackra file contract:
 * Purpose: the native `Highlight`: a text with the search terms tinted, matched ignoring case, Arabic diacritics,
 *          tatweel and letter variants (`highlightPartsOf`).
 * Boundary: one Text with nested Texts, so iOS and Android shape the whole string at once and Arabic letters stay
 *           joined across a match's edges; a match only takes a background, never a weight or spacing change.
 * Runtime: react-native
 * Governing contract: ADR 0060 (Arabic rendering rules); STA-1371.
 */
import type { ReactElement } from "react";

import { highlightPartsOf } from "#core/functions/highlight-parts-of.function";
import type { HighlightProps } from "#native/highlight/highlight.props";
import { Text } from "#native/text/text";

/** A text with its search terms marked. */
export function Highlight({ children, query, className }: HighlightProps): ReactElement {
  return (
    <Text {...(className ? { className } : {})}>
      {highlightPartsOf(children, query).map((part, index) =>
        part.isMatch ? (
          // oxlint-disable-next-line react/no-array-index-key -- split parts of one string have no identity but their place in it
          <Text key={index} className="bg-warning/30">
            {part.text}
          </Text>
        ) : (
          part.text
        ),
      )}
    </Text>
  );
}
