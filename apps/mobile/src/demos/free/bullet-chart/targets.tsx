/**
 * Stackra file contract:
 * Purpose: the "targets" demo of the native BulletChart: three quarter targets with their bands and target ticks.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); STA-1371.
 */
import { BulletChart, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { BULLET_CHART_DEMO_KEYS } from "#src/demos/free/bullet-chart/bullet-chart-demo-keys.constant";

/** The demo's keys. */
const K = BULLET_CHART_DEMO_KEYS.demo_free.bullet_chart.targets;

/** The BulletChart demo: quarter targets. */
export default function Targets() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <BulletChart
      items={[
        { key: "revenue", label: t(K.revenue), value: 412, target: 450, ranges: [300, 400, 500] },
        {
          key: "customers",
          label: t(K.customers),
          value: 1260,
          target: 1100,
          ranges: [800, 1000, 1400],
        },
        {
          key: "satisfaction",
          label: t(K.satisfaction),
          value: 71,
          target: 80,
          ranges: [50, 70, 100],
        },
      ]}
      valueFormat={{ maximumFractionDigits: 0 }}
      label={t(K.label)}
    />
  );
}
