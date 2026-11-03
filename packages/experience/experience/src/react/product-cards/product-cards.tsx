/**
 * Stackra file contract:
 * Purpose: `ProductCards`, the landing kit's "Built on Stackra" cards: one `BentoCard` per product, each in its
 *          own theme, in a scrolling `Marquee` strip or a `Grid`.
 * Boundary: composition of @stackra/ui only. Both layouts are a group named by `label`. The marquee owns the motion
 *           (it stops on hover, focus and its pause button, and stands still and wraps under reduced motion); its
 *           second copy is inert, so each link is reached once. Every word comes in props.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0165 (UI through @stackra/ui); ADR 0060 (light, dark, RTL); WCAG
 *          2.2 SC 2.2.2; STA-2041.
 */
import { BentoCard, Grid, Marquee } from "@stackra/ui/react";
import type { ReactElement } from "react";

import type { ProductCardsProps } from "#react/product-cards/product-cards.props";

/**
 * The products built on Stackra.
 *
 * @example
 * <ProductCards label="Built on Stackra" products={products} layout="grid" />
 */
export function ProductCards({
  label,
  products,
  linkLabel,
  layout = "strip",
  className,
}: ProductCardsProps): ReactElement {
  const cards = products.map((product) => (
    <BentoCard
      key={product.id}
      title={product.name}
      description={product.descriptor}
      brand={product.theme}
      actions={
        product.href
          ? [{ id: product.id, label: linkLabel ?? product.name, href: product.href }]
          : undefined
      }
      className={layout === "strip" ? "w-72 shrink-0" : undefined}
    />
  ));
  return layout === "strip" ? (
    <Marquee label={label} className={className}>
      {cards}
    </Marquee>
  ) : (
    <Grid role="group" aria-label={label} minItemWidth={240} className={className}>
      {cards}
    </Grid>
  );
}
