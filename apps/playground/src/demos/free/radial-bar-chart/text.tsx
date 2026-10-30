/**
 * Stackra file contract:
 * Purpose: the "text" demo of the web Radial bar chart: one ring filled toward a goal of 1,500 visitors, with the count in the middle.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371.
 */
import { Card, RadialBarChart, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { RADIAL_BAR_CHART_KEYS } from "#src/demos/free/radial-bar-chart/radial-bar-chart-keys.constant";

/** The demo's keys. */
const K = RADIAL_BAR_CHART_KEYS.radial_bar_chart;

/** Radial bar chart: text. */
export default function Text() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Card className="w-full">
      <Card.Header>
        <div className="grid gap-1">
          <Card.Title>{t(K.text_title)}</Card.Title>
          <Card.Description>{t(K.months_description)}</Card.Description>
        </div>
      </Card.Header>
      <Card.Content>
        <RadialBarChart
          data={[{ browser: "safari", visitors: 1260 }]}
          series={[{ key: "safari", label: t(K.safari), color: "chart-2" }]}
          nameKey="browser"
          valueKey="visitors"
          maxValue={1500}
          centerLabel={t(K.visitors)}
          label={t(K.text_title)}
        />
      </Card.Content>
      <Card.Footer className="text-sm text-muted">{t(K.trend)}</Card.Footer>
    </Card>
  );
}
