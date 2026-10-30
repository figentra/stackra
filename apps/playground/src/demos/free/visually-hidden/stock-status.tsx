/**
 * Stackra file contract:
 * Purpose: the "stock-status" demo of the web VisuallyHidden: product rows whose stock is a coloured icon on screen and
 *          a word to a screen reader, so colour is never the only signal.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0304; ADR 0060 (light, dark, RTL).
 */
import { Icon, Text, useCatalogueText, VisuallyHidden } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { VISUALLY_HIDDEN_KEYS } from "#src/demos/free/visually-hidden/visually-hidden-keys.constant";

/** The demo's keys. */
const K = VISUALLY_HIDDEN_KEYS.visually_hidden;

/** Each product's stock, its word and its tone; the icon's shape follows the tone. */
const ROWS = [
  { sku: "SKU-101", status: K.in_stock, tone: "success" },
  { sku: "SKU-102", status: K.low_stock, tone: "warning" },
  { sku: "SKU-103", status: K.out_of_stock, tone: "danger" },
] as const;

/** VisuallyHidden: Stock status. */
export default function StockStatus() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <ul className="grid max-w-sm gap-2">
      {ROWS.map(({ sku, status, tone }) => (
        <li key={sku} className="flex items-center gap-3">
          <Icon
            name={
              tone === "success"
                ? "circle-check"
                : tone === "warning"
                  ? "triangle-alert"
                  : "circle-alert"
            }
            tone={tone}
            size="sm"
          />
          <Text>
            {t(K.product, { sku })}
            <VisuallyHidden>{t(status)}</VisuallyHidden>
          </Text>
        </li>
      ))}
    </ul>
  );
}
