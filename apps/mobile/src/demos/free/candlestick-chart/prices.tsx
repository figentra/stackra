/**
 * Stackra file contract:
 * Purpose: the "prices" demo of the native CandlestickChart: 30 trading days of open, high, low and close, with volume.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); STA-1371 (charts wave 2).
 */
import { CandlestickChart, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { CANDLESTICK_CHART_DEMO_KEYS } from "#src/demos/free/candlestick-chart/candlestick-chart-demo-keys.constant";

/** The demo's keys. */
const K = CANDLESTICK_CHART_DEMO_KEYS.demo_free.candlestick_chart.prices;

/** 30 trading days from 1 September 2026: a drift up with daily swings, the same every time. */
const DAYS = Array.from({ length: 30 }, (_, day) => {
  const open = 42 + day * 0.35 + 2.2 * Math.sin(day / 2.3);
  const close = open + 1.6 * Math.sin(day * 1.7) + 0.4;
  return {
    date: new Date(Date.UTC(2026, 8, 1 + day + Math.floor(day / 5) * 2)).toISOString().slice(0, 10),
    open: Number(open.toFixed(2)),
    close: Number(close.toFixed(2)),
    high: Number((Math.max(open, close) + 0.6 + ((day * 7) % 5) / 6).toFixed(2)),
    low: Number((Math.min(open, close) - 0.5 - ((day * 3) % 4) / 5).toFixed(2)),
    volume: 120_000 + ((day * 37_000) % 160_000),
  };
});

/** A month of daily prices. */
export default function Prices() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <CandlestickChart
      data={DAYS}
      xFormat={{ month: "short", day: "numeric" }}
      valueFormat={{ style: "currency", currency: "SAR" }}
      label={t(K.label)}
    />
  );
}
