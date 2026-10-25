/**
 * Stackra file contract:
 * Purpose: `PointsIssuedInput`, the input of `loyalty_kit.points.stats_today@1`.
 * Boundary: a shape class in its own file with no fields: the day comes from the call's time zone in the context, never
 *           from the caller. The output is `PointsIssuedView` (core, shared with the renderer). It registers its schema
 *           when the module loads (STA-339 replaces the registration).
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 4, 13 and 26); ADR 0305 (one declaration per file).
 */
import { registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

/**
 * No fields.
 *
 * @example
 * PointsIssuedInput.create({});
 */
export class PointsIssuedInput extends Schema {}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([[PointsIssuedInput, z.object({})]]);
