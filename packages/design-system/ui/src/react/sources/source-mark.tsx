/**
 * Stackra file contract:
 * Purpose: `SourceMark`, the 14 px mark at the start of a web source chip: the site's favicon, the title's letter when
 *          there is none (or it fails to load), or a document icon.
 * Boundary: decorative (`aria-hidden`); the chip carries the name. Internal to SourceChip and Sources.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); STA-1371 (component gaps, owner approval 2026-10-31).
 */
import { useState, type ReactElement } from "react";

import type { SourceItem } from "#contracts/types/source-item.type";
import { sourceLinkOf } from "#core/functions/source-link-of.function";
import { Icon } from "#react/icon/icon";

/** A source's favicon, letter or document mark. */
export function SourceMark({ source }: { readonly source: SourceItem }): ReactElement {
  const [isBroken, setBroken] = useState(false);
  const { href, letter } = sourceLinkOf(source);
  if (href === undefined) {
    return (
      <span aria-hidden="true" className="grid size-3.5 shrink-0 place-items-center">
        <Icon name="file-text" size="sm" className="size-3.5" />
      </span>
    );
  }
  if (source.faviconSrc && !isBroken) {
    return (
      <img
        src={source.faviconSrc}
        alt=""
        aria-hidden="true"
        onError={() => setBroken(true)}
        className="size-3.5 shrink-0 rounded-[var(--radius-pill)] bg-surface object-cover ring-1 ring-default"
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="grid size-3.5 shrink-0 place-items-center rounded-[var(--radius-pill)] bg-foreground text-[0.7em] leading-none font-semibold text-background ring-1 ring-default"
    >
      {letter}
    </span>
  );
}
