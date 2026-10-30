/**
 * Stackra file contract:
 * Purpose: the "traffic" demo of the native SankeyChart: where a month's visitors came from, which page they reached, and
 *          whether they paid.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371.
 */
import { SankeyChart, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { SANKEY_CHART_DEMO_KEYS } from "#src/demos/free/sankey-chart/sankey-chart-demo-keys.constant";

/** The demo's keys. */
const K = SANKEY_CHART_DEMO_KEYS.demo_free.sankey_chart.traffic;

/** The stages, in reading order. */
const NODES = ["search", "social", "direct", "product", "home", "cart", "left", "paid"] as const;

/** A month of visitors from source to page to outcome. */
const LINKS = [
  { source: "search", target: "product", value: 4200 },
  { source: "search", target: "home", value: 1300 },
  { source: "social", target: "product", value: 1800 },
  { source: "social", target: "home", value: 900 },
  { source: "direct", target: "home", value: 2100 },
  { source: "product", target: "cart", value: 3400 },
  { source: "product", target: "left", value: 2600 },
  { source: "home", target: "cart", value: 1200 },
  { source: "home", target: "left", value: 3100 },
  { source: "cart", target: "paid", value: 2900 },
  { source: "cart", target: "left", value: 1700 },
];

/** Sankey chart: traffic. */
export default function Traffic() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <SankeyChart
      label={t(K.label)}
      nodes={NODES.map((key) => ({ key, label: t(K[key]) }))}
      links={LINKS}
    />
  );
}
