/**
 * Stackra file contract:
 * Purpose: the "product-grid" demo of the web useBreakpoint: a POS product grid that shows two, three or four tiles a
 *          row for a phone, a counter tablet or a desktop, and more products on the larger screens.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0304; ADR 0060 (light, dark, RTL).
 */
import { Card, useBreakpoint, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { USE_BREAKPOINT_KEYS } from "#src/demos/free/use-breakpoint/use-breakpoint-keys.constant";

/** The demo's keys. */
const K = USE_BREAKPOINT_KEYS.use_breakpoint;

/** The columns, and how many products show, for each size class. */
const LAYOUT = {
  phone: { columns: "grid-cols-2", shown: 4 },
  tablet: { columns: "grid-cols-3", shown: 6 },
  desktop: { columns: "grid-cols-4", shown: 8 },
} as const;

/** The products on the grid. */
const PRODUCTS = [
  "coffee",
  "croissant",
  "laban",
  "dates",
  "tea",
  "cheese",
  "juice",
  "maamoul",
] as const;

/** useBreakpoint: Product grid. */
export default function ProductGrid() {
  const t = useCatalogueText(MESSAGES.en);
  const { columns, shown } = LAYOUT[useBreakpoint().sizeClass];
  return (
    <ul aria-label={t(K.products)} className={`grid gap-3 ${columns}`}>
      {PRODUCTS.slice(0, shown).map((product) => (
        <li key={product}>
          <Card>
            <Card.Header>
              <Card.Title>{t(K.product[product])}</Card.Title>
            </Card.Header>
          </Card>
        </li>
      ))}
    </ul>
  );
}
