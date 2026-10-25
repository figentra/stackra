/**
 * Stackra file contract:
 * Purpose: `LoyaltyOverviewDocument`, the customer-portal "My points" page: a dashboard holding the member's
 *          points-balance widget.
 * Boundary: a document is a saved, scope-editable tree that only references registered code (ADR 0110, 0154): no
 *           markup, no expressions, no logic. A Dashboard places widget classes only, laid out on the grid by order and
 *           size, so a host adds its own tiles without editing this file; a scope may rearrange it, a member may hide
 *           tiles. Points are spent at checkout through the host's order flow, so the page holds no form. It is in the
 *           app area (a package never names an app's panel); the key (`loyalty_kit.loyalty_overview`) and the title
 *           (`loyalty_kit::documents.loyalty_overview.title`) are derived, and each tile keeps its query's permission.
 *           The group and the icon are the stand-in typed constants until gen writes `I18n` and `Icons`.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 13, 16 and 20); ADR 0307 (rule 20); ADR 0110; ADR 0154; ADR 0270
 *                     (dashboards); owner decision R-56.
 */
import { ApiArea } from "@stackra/contracts";
import { Blocks, Document, DocumentKind } from "@stackra/panel";

import { LOYALTY_KIT_KEYS } from "#core/constants/loyalty-kit-keys.constant";
import { LOYALTY_KIT_ICONS } from "#node/constants/loyalty-kit-icons.constant";
import { PointsBalanceWidget } from "#node/resources/loyalty-account/points-balance.widget";

/**
 * Route `/loyalty` in the app area, listed under Loyalty.
 *
 * @example
 * kindOf(LoyaltyOverviewDocument)?.options; // { kind: "dashboard", path: "/loyalty", ... }
 */
export class LoyaltyOverviewDocument extends Document({
  kind: DocumentKind.Dashboard,
  path: "/loyalty",
  area: ApiArea.App,
  navigation: {
    group: LOYALTY_KIT_KEYS.loyalty_kit.nav.loyalty,
    icon: LOYALTY_KIT_ICONS.Star,
    order: 10,
  },
  blocks: [Blocks.widget(PointsBalanceWidget)],
}) {}
