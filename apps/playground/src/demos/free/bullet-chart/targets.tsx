/**
 * Stackra file contract:
 * Purpose: the "targets" demo of the web BulletChart: three quarter targets, each with its poor, fair and good bands, its progress and its target tick.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371.
 */
import { BulletChart, Card, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { BULLET_CHART_KEYS } from "#src/demos/free/bullet-chart/bullet-chart-keys.constant";

/** The demo's keys. */
const K = BULLET_CHART_KEYS.bullet_chart;

/** Bullet chart: targets. */
export default function Targets() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Card className="w-full">
      <Card.Header>
        <div className="grid gap-1">
          <Card.Title>{t(K.targets_title)}</Card.Title>
          <Card.Description>{t(K.targets_description)}</Card.Description>
        </div>
      </Card.Header>
      <Card.Content>
        <BulletChart
          items={[
            {
              key: "revenue",
              label: t(K.revenue),
              value: 412,
              target: 450,
              ranges: [300, 400, 500],
            },
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
          label={t(K.targets_title)}
        />
      </Card.Content>
    </Card>
  );
}
