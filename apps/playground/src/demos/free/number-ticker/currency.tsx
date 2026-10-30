/**
 * Stackra file contract:
 * Purpose: the "currency" demo of the web NumberTicker: a month's revenue counting up from zero as money, with the
 *          currency and decimals set by `format`.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0329 (motion layer); ADR 0060 (light, dark, RTL); STA-1371.
 */
import { NumberTicker, Text, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { NUMBER_TICKER_KEYS } from "#src/demos/free/number-ticker/number-ticker-keys.constant";

/** The demo's keys. */
const K = NUMBER_TICKER_KEYS.number_ticker;

/** Riyals with two decimals. */
const MONEY = { style: "currency", currency: "SAR", minimumFractionDigits: 2 } as const;

/** NumberTicker: currency. */
export default function Currency() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="grid gap-2">
      <Text tone="muted">{t(K.revenue)}</Text>
      <span className="text-3xl font-semibold">
        <NumberTicker value={48_215.5} duration={1400} format={MONEY} />
      </span>
    </div>
  );
}
