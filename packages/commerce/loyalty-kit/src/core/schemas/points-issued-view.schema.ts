/**
 * Stackra file contract:
 * Purpose: `PointsIssuedView`, the output of `loyalty_kit.points.stats_today@1`, today's movement for the dashboard
 *          renderer.
 * Boundary: a shape class shared by the query (node) and the renderer (react), so it lives in core. It registers its
 *           schema when the module loads (STA-339 replaces the registration).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4, 15 and 26); ADR 0328 (`create`).
 */
import { Int, registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

/**
 * Points credited and points spent today, in whole points.
 *
 * @example
 * return PointsIssuedView.create({ earned: 420, redeemed: 60 });
 */
export class PointsIssuedView extends Schema {
  /** Points earned today. */
  @Int({ min: 0 })
  earned!: number;

  /** Points redeemed today, as a positive number. */
  @Int({ min: 0 })
  redeemed!: number;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [PointsIssuedView, z.object({ earned: z.number().int(), redeemed: z.number().int() })],
]);
