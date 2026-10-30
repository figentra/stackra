/**
 * Stackra file contract:
 * Purpose: the "counter" demo of the web NumberTicker: a sales count that counts on from where it stands each time a
 *          sale is recorded, in the page's digits.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0329 (motion layer); ADR 0060 (light, dark, RTL); STA-1371.
 */
import { Button, NumberTicker, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { NUMBER_TICKER_KEYS } from "#src/demos/free/number-ticker/number-ticker-keys.constant";

/** The demo's keys. */
const K = NUMBER_TICKER_KEYS.number_ticker;

/** NumberTicker: counter. */
export default function Counter() {
  const t = useCatalogueText(MESSAGES.en);
  const [sales, setSales] = useState(1280);
  return (
    <div className="grid gap-3">
      <Text tone="muted">{t(K.sales)}</Text>
      <span className="text-4xl font-semibold">
        <NumberTicker value={sales} />
      </span>
      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" onPress={() => setSales((count) => count + 37)}>
          {t(K.add)}
        </Button>
        <Button variant="ghost" onPress={() => setSales(0)}>
          {t(K.reset)}
        </Button>
      </div>
    </div>
  );
}
