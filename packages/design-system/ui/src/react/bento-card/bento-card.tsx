/**
 * Stackra file contract:
 * Purpose: the web `BentoCard`: one card of a marketing bento grid: a heading, one or two lines, up to two pill links,
 *          and a live widget at the bottom, over optional dithered art; on the kit's `lg` radius (6 px, owner Q2). With
 *          `brand` it draws in a product's own theme; with `span={2}` it takes both columns of the grid from `md` up.
 * Boundary: an `article` named by its heading. The links are React Aria links drawn as HeroUI buttons, so they keep
 *           link semantics. The art is decoration (DitherArt is hidden from assistive tech).
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3, decision 5: adapted form); ADR 0060 (right-to-left); STA-2041 (owner Q2).
 */
import { buttonVariants, cn } from "@heroui/react";
import { type ReactElement, useId } from "react";
import { Link } from "react-aria-components";

import type { BentoCardProps } from "#react/bento-card/bento-card.props";
import { DitherArt } from "#react/dither-art/dither-art";
import { Heading } from "#react/heading/heading";
import { useThemeStyle } from "#react/hooks/use-theme-style";
import { Text } from "#react/text/text";

/** A card of a marketing bento grid. */
export function BentoCard({
  title,
  headingLevel = 3,
  description,
  actions,
  media,
  mediaBleed = "bottom",
  art,
  brand,
  span = 1,
  className,
}: BentoCardProps): ReactElement {
  const titleId = useId();
  const style = useThemeStyle(brand);
  return (
    <article
      aria-labelledby={titleId}
      data-slot="bento-card"
      data-span={span}
      {...(brand ? { "data-brand": brand.name } : {})}
      style={style}
      className={cn(
        "relative flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface text-foreground",
        span === 2 && "md:col-span-2",
        className,
      )}
    >
      {/* Faded toward the top by default, so the title never sits on full-strength art. */}
      {art ? (
        <DitherArt mask="top" {...art} className={cn("absolute inset-0", art.className)} />
      ) : null}
      <div className="relative flex flex-col gap-2 p-6">
        <Heading level={headingLevel} type="h4" id={titleId}>
          {title}
        </Heading>
        {description == null ? null : <Text tone="muted">{description}</Text>}
        {actions && actions.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {actions.slice(0, 2).map((action) => (
              <Link
                key={action.id}
                href={action.href}
                className={
                  cn(
                    buttonVariants({
                      variant: action.variant === "primary" ? "primary" : "secondary",
                      size: "sm",
                    }),
                    "rounded-[var(--radius-pill)]",
                  ) ?? ""
                }
              >
                {action.label}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
      {media == null ? null : (
        <div
          data-slot="bento-card-media"
          data-bleed={mediaBleed}
          className={cn(
            "relative mt-auto",
            mediaBleed === "none" && "px-6 pb-6",
            mediaBleed === "bottom" && "px-6",
          )}
        >
          {media}
        </div>
      )}
    </article>
  );
}
