/**
 * Stackra file contract:
 * Purpose: `isolatedFileNameOf`, a file name wrapped in Unicode isolates for a renderer that takes plain text (React
 *          Native's Text): the whole name in an isolate of the base's direction, the base in a first-strong isolate
 *          (FSI…PDI) and the extension in a left-to-right isolate (LRI…PDI), so the extension stays at the name's
 *          reading end on an Arabic or English screen.
 * Boundary: pure; adds only invisible isolate marks and never reverses a character. Accessibility labels keep the
 *           plain name.
 * Runtime: isomorphic
 * Governing contract: ADR 0060 (right-to-left); UAX #9 (isolates); STA-1371 (wave C).
 */
import { fileNamePartsOf } from "#core/functions/file-name-parts-of.function";

/** U+2066 left-to-right isolate, U+2067 right-to-left isolate, U+2068 first-strong isolate, U+2069 pop. */
const LRI = "\u{2066}";
const RLI = "\u{2067}";
const FSI = "\u{2068}";
const PDI = "\u{2069}";

/** `name` with each part isolated. */
export function isolatedFileNameOf(name: string): string {
  const { base, extension, direction } = fileNamePartsOf(name);
  const tail = extension ? `${LRI}${extension}${PDI}` : "";
  return `${direction === "rtl" ? RLI : LRI}${FSI}${base}${PDI}${tail}${PDI}`;
}
