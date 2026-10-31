/**
 * Stackra file contract:
 * Purpose: the web `SourceChip`: one citation of an AI answer as a 20 px pill on the default fill: its favicon (or
 *          letter, or a document mark) and its title. A web source is a link that opens in a new tab; a source with a
 *          `description` previews it in a HoverCard on hover or focus.
 * Boundary: only `http:` and `https:` links are followed (`sourceLinkOf`), so a model's `javascript:` URL is shown as
 *           a document. The link is named with its title and "opens in a new tab"; a document with a preview is a
 *           button, one without is plain text. The title is isolated (`dir="auto"`), so a Latin name keeps its order
 *           in Arabic. Colours and radius are tokens.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WCAG 2.2 SC 2.4.4 and 3.2.5; STA-1371
 *          (component gaps, owner approval 2026-10-31).
 */
import { cn, Link as HeroLink } from "@heroui/react";
import type { ReactElement } from "react";

import { AI_PARTS_KEYS } from "#core/constants/ai-parts-keys.constant";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { sourceLinkOf } from "#core/functions/source-link-of.function";
import { HoverCard } from "#react/hover-card/hover-card";
import { useUiText } from "#react/hooks/use-ui-text";
import { SourceMark } from "#react/sources/source-mark";
import type { SourceChipProps } from "#react/sources/source-chip.props";

/** The chip's look: a 20 px pill. */
const PILL =
  "inline-flex h-5 max-w-60 items-center gap-1 rounded-[var(--radius-pill)] bg-default ps-0.5 pe-2 text-xs text-muted no-underline transition-colors duration-(--duration-fast) motion-reduce:transition-none";

/** One citation. */
export function SourceChip({ source, className }: SourceChipProps): ReactElement {
  const t = useUiText();
  const { href, title } = sourceLinkOf(source);
  const content = (
    <>
      <SourceMark source={source} />
      <span dir="auto" className="truncate">
        {title}
      </span>
    </>
  );
  const chip =
    href === undefined ? (
      source.description ? (
        <button
          type="button"
          aria-label={`${title}, ${t(AI_PARTS_KEYS.ui.sources.document)}`}
          className={cn(
            PILL,
            "hover:text-foreground focus-visible:outline focus-visible:outline-focus",
            className,
          )}
        >
          {content}
        </button>
      ) : (
        <span className={cn(PILL, className)}>{content}</span>
      )
    ) : (
      <HeroLink
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${title} (${t(UI_KEYS.ui.link.opens_in_new_tab)})`}
        className={cn(PILL, "hover:text-foreground", className) ?? ""}
      >
        {content}
      </HeroLink>
    );
  if (!source.description) return chip;
  return (
    <HoverCard trigger={chip} label={title}>
      <div className="grid gap-1 p-1">
        <span dir="auto" className="text-sm font-medium text-foreground">
          {title}
        </span>
        <span dir="auto" className="text-xs leading-relaxed text-muted">
          {source.description}
        </span>
      </div>
    </HoverCard>
  );
}
