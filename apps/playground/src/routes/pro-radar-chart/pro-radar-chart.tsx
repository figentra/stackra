/**
 * Stackra file contract:
 * Purpose: the page of the RadarChart route: `@stackra-pro/ui`'s RadarChart with one series (a skill assessment) and
 *          with two series compared (two teams, a legend that names each), each with a named container and HeroUI
 *          Pro's own tooltip card on hover.
 * Boundary: presentation only; the figures are local. A chart's container is named by `label` with `role="img"`, and
 *          the legend is text beside the colour swatch, since colour alone names nothing.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0060 (light, dark, RTL); STA-416 FR-012.
 */
import * as UiPro from "@stackra-pro/ui/react";

import { DemoChartTick } from "#src/components/demo-chart-tick";
import { ProRadarChartRoute } from "#src/routes/pro-radar-chart/pro-radar-chart.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::pro-radar-chart.*` keys.
const STRINGS = {
  documentTitle: `${ProRadarChartRoute.title} · Stackra Playground`,
  intro:
    "A radar chart compares several measures on one shape; two shapes compare two subjects. Hover or focus a point for its value.",
  skills: "Skill assessment",
  skillsLabel:
    "Radar chart of skill scores out of 100: design, frontend, backend, DevOps, testing and leadership",
  teams: "Team comparison",
  teamsLabel: "Radar chart comparing Team A and Team B on six measures out of 100",
} as const;

const SKILLS = [
  { category: "Design", score: 86 },
  { category: "Frontend", score: 92 },
  { category: "Backend", score: 74 },
  { category: "DevOps", score: 65 },
  { category: "Testing", score: 78 },
  { category: "Leadership", score: 70 },
];

const TEAMS = [
  { category: "Speed", teamA: 85, teamB: 70 },
  { category: "Reliability", teamA: 78, teamB: 88 },
  { category: "Security", teamA: 90, teamB: 75 },
  { category: "UX", teamA: 72, teamB: 82 },
  { category: "Performance", teamA: 88, teamB: 68 },
  { category: "Scalability", teamA: 65, teamB: 80 },
];

const TEAM_SERIES = [
  { key: "teamA", name: "Team A", color: "var(--chart-3)" },
  { key: "teamB", name: "Team B", color: "var(--chart-1)" },
] as const;

/** The RadarChart page. */
export function ProRadarChart() {
  return (
    <article className="grid gap-6">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <h1 className="type-h1">{ProRadarChartRoute.title}</h1>
        <p className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </p>
      </header>
      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="skills-heading" className="grid max-w-md gap-3">
          <h2 id="skills-heading" className="type-h2">
            {STRINGS.skills}
          </h2>
          <UiPro.RadarChart data={SKILLS} height={280} label={STRINGS.skillsLabel} role="img">
            <UiPro.RadarChart.Grid />
            <UiPro.RadarChart.AngleAxis dataKey="category" tick={<DemoChartTick />} />
            <UiPro.RadarChart.Radar
              dataKey="score"
              dot={{ fill: "var(--chart-3)", r: 3, strokeWidth: 0 }}
              fill="var(--chart-3)"
              fillOpacity={0.15}
              name="Score"
              stroke="var(--chart-3)"
              strokeWidth={2}
            />
            <UiPro.RadarChart.Tooltip content={<UiPro.RadarChart.TooltipContent />} />
          </UiPro.RadarChart>
        </section>
        <section aria-labelledby="teams-heading" className="grid max-w-md gap-3">
          <h2 id="teams-heading" className="type-h2">
            {STRINGS.teams}
          </h2>
          <ul className="flex flex-wrap gap-4 text-sm">
            {TEAM_SERIES.map((series) => (
              <li key={series.key} className="flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="size-3 rounded-full"
                  style={{ backgroundColor: series.color }}
                />
                <bdi>{series.name}</bdi>
              </li>
            ))}
          </ul>
          <UiPro.RadarChart data={TEAMS} height={280} label={STRINGS.teamsLabel} role="img">
            <UiPro.RadarChart.Grid />
            <UiPro.RadarChart.AngleAxis dataKey="category" tick={<DemoChartTick />} />
            {TEAM_SERIES.map((series) => (
              <UiPro.RadarChart.Radar
                key={series.key}
                dataKey={series.key}
                dot={{ fill: series.color, r: 3, strokeWidth: 0 }}
                fill={series.color}
                fillOpacity={0.15}
                name={series.name}
                stroke={series.color}
                strokeWidth={2}
              />
            ))}
            <UiPro.RadarChart.Tooltip content={<UiPro.RadarChart.TooltipContent />} />
          </UiPro.RadarChart>
        </section>
      </div>
    </article>
  );
}
