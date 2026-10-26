/**
 * Stackra file contract:
 * Purpose: the web `KpiGroup` compound on HeroUI Pro's KPIGroup (acronyms are cased as words): the group root, which
 *          lays out several `Kpi` cards, and the part Separator.
 * Boundary: no styling or behaviour of its own; the look needs `@heroui-pro/react/css`. `orientation` is HeroUI
 *          Pro's, passed through. The compound exposes the documented parts: HeroUI Pro's `KPIGroup.Root` is left
 *          out. Groups the `Kpi` wrapper of this package (`#react/kpi/kpi`).
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0231 (acronyms cased as words); STA-416 FR-005.
 */
import { KPIGroup as HeroKpiGroup } from "@heroui-pro/react/kpi-group";

import type { KpiGroupProps } from "#react/kpi-group/kpi-group.props";

/** The group root: HeroUI Pro's, a row or column of `Kpi` cards. */
function KpiGroupRoot(props: KpiGroupProps) {
  return <HeroKpiGroup.Root {...props} />;
}

/** The parts of the compound, typed from HeroUI Pro's own so the declaration output can name them. */
interface KpiGroupParts {
  /** A divider between two cards. */
  readonly Separator: typeof HeroKpiGroup.Separator;
}

/** A group of `Kpi` cards that share one surface, with `KpiGroup.Separator` between them. */
export const KpiGroup: typeof KpiGroupRoot & KpiGroupParts = Object.assign(KpiGroupRoot, {
  Separator: HeroKpiGroup.Separator,
});
