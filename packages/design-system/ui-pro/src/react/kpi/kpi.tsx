/**
 * Stackra file contract:
 * Purpose: the web `Kpi` compound on HeroUI Pro's KPI (acronyms are cased as words): the card root and the parts
 *          Header, Content, Icon, Title, Value, Trend, Progress, Actions, Chart, Separator and Footer, with HeroUI
 *          Pro's own part names.
 * Boundary: no styling or behaviour of its own; the look needs `@heroui-pro/react/css`. HeroUI Pro draws Title as a
 *          `dt` and Value as a `dd` with no `dl` around them (axe `dlitem`), so Header and Content wrap their children
 *          in a `dl` that is neither announced (`role="none"`) nor laid out (`display: contents`). `Kpi.Chart` draws with
 *          `recharts`, an optional peer. The compound exposes the documented parts: HeroUI Pro's `KPI.Root` is left
 *          out. Imports the `kpi` subpath, the only way to reach it.
 * Runtime: browser
 * Governing contract: ADR 0304 (decision 3); ADR 0303 (decision 7); ADR 0231 (acronyms cased as words); STA-403 FR-007.
 */
import { KPI as HeroKpi, type KPIRootProps as HeroKpiRootProps } from "@heroui-pro/react/kpi";
import type { ComponentProps } from "react";

import type { KpiContractProps } from "#contracts/types/kpi-contract-props.type";
import { KpiActions } from "#react/kpi/kpi-actions";
import { KpiIcon } from "#react/kpi/kpi-icon";
import { KpiProgress } from "#react/kpi/kpi-progress";

/** Props of the web Kpi: the shared contract plus HeroUI Pro's own card props, passed through unchanged. */
export type KpiProps = KpiContractProps & Omit<HeroKpiRootProps, keyof KpiContractProps>;

/** The card root: HeroUI Pro's `KPI.Root`, a card that holds the metric. */
function KpiRoot(props: KpiProps) {
  return <HeroKpi.Root {...props} />;
}

/** The header row: HeroUI Pro's, its children (the `dt` title among them) inside a `dl` that adds no semantics. */
function KpiHeader({ children, ...props }: ComponentProps<typeof HeroKpi.Header>) {
  return (
    <HeroKpi.Header {...props}>
      <dl role="none" className="contents">
        {children}
      </dl>
    </HeroKpi.Header>
  );
}

/** The body: HeroUI Pro's, its children (the `dd` value among them) inside a `dl` that adds no semantics. */
function KpiContent({ children, ...props }: ComponentProps<typeof HeroKpi.Content>) {
  return (
    <HeroKpi.Content {...props}>
      <dl role="none" className="contents">
        {children}
      </dl>
    </HeroKpi.Content>
  );
}

/** The parts of the compound, typed from HeroUI Pro's own so the declaration output can name them. */
interface KpiParts {
  /** The header row: icon, title and actions. */
  readonly Header: typeof KpiHeader;
  /** The body: value, trend and progress. */
  readonly Content: typeof KpiContent;
  /** The icon, tinted by `tone`. */
  readonly Icon: typeof KpiIcon;
  /** The metric's name. */
  readonly Title: typeof HeroKpi.Title;
  /** The metric's value, formatted as a number. */
  readonly Value: typeof HeroKpi.Value;
  /** The trend chip showing the change. */
  readonly Trend: typeof HeroKpi.Trend;
  /** The progress bar, tinted by `tone` and named by `label`. */
  readonly Progress: typeof KpiProgress;
  /** The icon-only actions button, named by `label`. */
  readonly Actions: typeof KpiActions;
  /** The sparkline of the metric's history. */
  readonly Chart: typeof HeroKpi.Chart;
  /** A divider between sections. */
  readonly Separator: typeof HeroKpi.Separator;
  /** The footer, for a comparison note. */
  readonly Footer: typeof HeroKpi.Footer;
}

/**
 * A metric card: `Kpi.Header` holds `Icon`, `Title` and `Actions`, `Kpi.Content` holds `Value`, `Trend`, `Progress`
 * and `Chart`, and `Kpi.Footer` holds the note.
 */
export const Kpi: typeof KpiRoot & KpiParts = Object.assign(KpiRoot, {
  Header: KpiHeader,
  Content: KpiContent,
  Icon: KpiIcon,
  Title: HeroKpi.Title,
  Value: HeroKpi.Value,
  Trend: HeroKpi.Trend,
  Progress: KpiProgress,
  Actions: KpiActions,
  Chart: HeroKpi.Chart,
  Separator: HeroKpi.Separator,
  Footer: HeroKpi.Footer,
});
