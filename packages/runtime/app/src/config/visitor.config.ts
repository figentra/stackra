/**
 * Stackra file contract:
 * Purpose: `VisitorConfig`, the configuration (key `app.visitor`) of the signed visitor identity an anonymous call
 *          carries from one request to the next.
 * Boundary: a configuration class over `VisitorOptions` with no env map: its two keys are `@Secret` fields, and runway's
 *           `config.app.visitor` layer sets the rest per environment. A host overrides it with `override` members only.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 20); ADR 0146 as amended; STA-2025 (as amended 2026-11-09).
 */
import { Config } from "@stackra/config";

import { VisitorOptions } from "#core/schemas/visitor-options.schema";

/**
 * The visitor identity configuration.
 *
 * @example
 * import { VisitorConfig as BaseVisitorConfig } from "@stackra/app/server";
 *
 * export class VisitorConfig extends BaseVisitorConfig {
 *   override cookieMaxAgeDays = 30;
 * }
 */
export class VisitorConfig extends Config({ schema: VisitorOptions }) {}
