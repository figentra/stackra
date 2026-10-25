/**
 * Stackra file contract:
 * Purpose: `PointsIssuedWidget`, a dashboard tile with today's points earned and redeemed.
 * Boundary: a declaration; nothing runs at request time. The query is the type argument (`Widget<PointsIssuedQuery>`),
 *           so `display` is checked against its output. A Custom display: the renderer is the kit's `PointsIssued` in
 *           `src/react/points-issued/`, bound by the widget's name. Its default place is the host dashboard's main
 *           grid; a host moves it with `Widget.place`. No `refreshOn`: refresh is derived from the query's
 *           `cache.invalidateOn`. The key (`loyalty_kit.points_issued`) and the title
 *           (`loyalty_kit::widgets.points_issued.title`) are derived, and the permission is the query's. Roles shape
 *           presentation only. The slot is the stand-in `LOYALTY_KIT_SLOTS` until gen writes `#stackra/slots`.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 13, 16 and 20); ADR 0307 (rules 14 to 19); ADR 0273 (roles shape
 *                     presentation only).
 */
import { SystemRole } from "@stackra/iam";
import { type Display, Widget, WidgetSize } from "@stackra/panel";

import type { PointsIssuedView } from "#core/schemas/points-issued-view.schema";
import { LOYALTY_KIT_SLOTS } from "#node/constants/loyalty-kit-slots.constant";
import type { PointsIssuedQuery } from "#node/queries/points-issued.query";

/**
 * Shown to owners and managers on their default dashboard; scope-wide numbers.
 *
 * @example
 * describeWidget(PointsIssuedWidget).options.slot?.key; // "dashboard.main"
 */
export class PointsIssuedWidget extends Widget<PointsIssuedQuery>({
  slot: LOYALTY_KIT_SLOTS.Dashboard.Main,
  size: WidgetSize.Small,
  roles: [SystemRole.Owner, SystemRole.Manager],
}) {
  /** The kit's own renderer draws the tile. */
  display(d: Display<PointsIssuedView>) {
    return d.custom();
  }
}
