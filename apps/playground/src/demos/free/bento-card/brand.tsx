/**
 * Stackra file contract:
 * Purpose: the "brand" demo of the web BentoCard: two cards of a "Built on" grid, each drawn in its product's own
 *          theme (Figentra Pay and Figentra Commerce) inside the page's theme, spanning one column each.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown. The two themes
 *           are built from the playground's vendored brand layers, as an app would pass its products' themes. The
 *           links point back at this demo.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0340 (decision 2: a brand is a layer above Stackra); ADR 0060 (light, dark, RTL); STA-2041.
 */
import { BentoCard, useCatalogueText } from "@stackra/ui/react";
import { useLocation } from "react-router";

import { BRAND_THEMES, buildBrandTheme } from "#src/constants/brand-themes";
import { MESSAGES } from "#src/constants/messages.constant";
import { BENTO_CARD_KEYS } from "#src/demos/free/bento-card/bento-card-keys.constant";

/** The demo's keys. */
const K = BENTO_CARD_KEYS.bento_card.brand;

/** The theme of a product's brand layer, or undefined (the page's own theme) when the playground carries none. */
const themeOf = (id: string) => {
  const brand = BRAND_THEMES.find((candidate) => candidate.id === id);
  return brand ? buildBrandTheme(brand.layer) : undefined;
};

/** Figentra Pay's theme. */
const PAY = themeOf("pay");

/** Figentra Commerce's theme. */
const COMMERCE = themeOf("commerce");

/** BentoCard: In a product's colours. */
export default function Brand() {
  const t = useCatalogueText(MESSAGES.en);
  const { pathname, search } = useLocation();
  // A same-page anchor that keeps the scheme and language, which a bare `#id` would drop.
  const here = `${pathname}${search}#bento-card-brand`;
  const products = [
    { id: "pay", name: t(K.pay), description: t(K.pay_description), brand: PAY },
    {
      id: "commerce",
      name: t(K.commerce),
      description: t(K.commerce_description),
      brand: COMMERCE,
    },
  ];
  return (
    <div className="grid w-full gap-4 md:grid-cols-2">
      {products.map((product) => (
        <BentoCard
          key={product.id}
          title={product.name}
          description={product.description}
          brand={product.brand}
          actions={[
            {
              id: product.id,
              label: t(K.visit, { product: product.name }),
              href: here,
              variant: "primary",
            },
          ]}
        />
      ))}
    </div>
  );
}
