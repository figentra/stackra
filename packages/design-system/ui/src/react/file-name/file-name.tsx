/**
 * Stackra file contract:
 * Purpose: the web `FileName`: a file name drawn so bidi cannot move its parts: the whole name is isolated in the
 *          direction of its base (`fileNamePartsOf`), the base sits in its own `dir="auto"` isolate and the extension
 *          in a left-to-right isolate at the name's reading end, so "فاتورة-1042.pdf" never reads "pdf.1042-فاتورة".
 * Boundary: inline and unstyled beyond `className`; the parent truncates. The text content is the name unchanged,
 *           so it is also the accessible name.
 * Runtime: browser
 * Governing contract: ADR 0060 (right-to-left); UAX #9 (isolates); STA-1371 (wave C).
 */
import type { ReactElement } from "react";

import { fileNamePartsOf } from "#core/functions/file-name-parts-of.function";
import type { FileNameProps } from "#react/file-name/file-name.props";

/** A file name with its base and extension isolated. */
export function FileName({ name, className }: FileNameProps): ReactElement {
  const { base, extension, direction } = fileNamePartsOf(name);
  return (
    <bdi dir={direction} data-slot="file-name" className={className}>
      <bdi dir="auto">{base}</bdi>
      {extension ? <bdi dir="ltr">{extension}</bdi> : null}
    </bdi>
  );
}
