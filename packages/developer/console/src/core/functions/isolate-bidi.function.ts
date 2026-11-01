/**
 * Stackra file contract:
 * Purpose: `isolateBidi(text)`, `text` with each right-to-left run (Arabic, Hebrew, Syriac, Thaana, N'Ko) wrapped in
 *          FIRST STRONG ISOLATE U+2068 and POP DIRECTIONAL ISOLATE U+2069, so a destination that applies the bidi
 *          algorithm keeps the run whole inside a left-to-right layout. Characters are never reordered here.
 * Boundary: pure; idempotent (text that already holds an isolate is returned as it is). Opt-in: the console's own
 *           components do not call it, because many terminals draw the isolate characters as visible boxes.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-026; Unicode UAX 9 (explicit isolates).
 */
import { RTL_RUN } from "#core/constants/rtl-run.constant";

/** FIRST STRONG ISOLATE. */
const FSI = "⁨";

/** POP DIRECTIONAL ISOLATE. */
const PDI = "⁩";

/** `text` with its RTL runs isolated. */
export function isolateBidi(text: string): string {
  if (text.includes(FSI)) return text;
  return text.replaceAll(RTL_RUN, (run) => `${FSI}${run}${PDI}`);
}
