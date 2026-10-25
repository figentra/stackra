/**
 * Stackra file contract:
 * Purpose: `Place`, the place type of a slot, with the displays each place takes as case data: a Band (KPIs on one
 *          row), a Grid (12 columns), an Aside, Tabs (one per widget), a Banner and a Checklist.
 * Boundary: an enum (`Enum.of`) written in a generated `slots({...})` tree; the dashboard and the widget slot skip a
 *           widget whose display its slot's place does not take. Banner and Checklist take the Banner and Check
 *           displays, which are not built yet, so they take none today.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 18: slots are typed places); ADR 0294 (decision 16: Enum).
 */
import { Enum } from "@stackra/contracts";

import { DisplayKind } from "#core/enums/display-kind.enum";

/** Every built display: what a grid, an aside or a tab can hold. */
const ANY: readonly DisplayKind[] = Object.freeze(Enum.values(DisplayKind));

/**
 * A slot's place type.
 *
 * @example
 * slots({ Dashboard: { Header: Place.Band, Main: Place.Grid } });
 * Enum.meta(Place, Place.Band).displays; // ["kpi", "kpi_group", "progress"]
 */
export const Place = Enum.of({
  /** One row of KPIs: Kpi, KpiGroup and Progress. */
  Band: [
    "band",
    { displays: Object.freeze([DisplayKind.Kpi, DisplayKind.KpiGroup, DisplayKind.Progress]) },
  ],
  /** The 12-column grid: Small 3, Medium 6, Large 9, Full 12. */
  Grid: ["grid", { displays: ANY }],
  /** The side column of a View or Edit page; the aside sets the width. */
  Aside: ["aside", { displays: ANY }],
  /** One tab per widget on a View page, labelled with the widget's title. */
  Tabs: ["tabs", { displays: ANY }],
  /** Full width above the page, at most two shown; takes the Banner display (not built yet). */
  Banner: ["banner", { displays: Object.freeze<DisplayKind[]>([]) }],
  /** The checklist launcher; takes the Check display (not built yet). */
  Checklist: ["checklist", { displays: Object.freeze<DisplayKind[]>([]) }],
});

/** One of the codes above. */
export type Place = Enum.Value<typeof Place>;
