/**
 * Stackra file contract:
 * Purpose: `SeoConfig`, the SEO configuration a web member overrides in its own `src/config/seo.config.ts`: the title
 *          template, robots groups, sitemap paging, noindex parameters, the Open Graph image route, hreflang and
 *          JSON-LD. Gen reads it for the robots, sitemap and OG route modules; the runtime reads it through the
 *          container (`ctx.config(SeoConfig)`) or by constructor type.
 * Boundary: a configuration class: the options are `SeoOptions`, the key is derived (`seo`), and no field reads the
 *           environment. A member's override keeps the name, imports this class as `BaseSeoConfig` and sets
 *           `override` field defaults only, restating a nested object's type (`BaseSeoConfig["og"]`). Loading this
 *           module registers the shipped schema, so `buildConfig` validates the class and every override.
 * Runtime: isomorphic
 * Governing contract: ADR 0301 (decisions 2, 3 and 7); ADR 0294 (decision 19; as amended by v3.1: the Base alias);
 *                     ADR 0146 as amended.
 */
import { Config } from "@stackra/config";
import { registerSchemas } from "@stackra/validation";

import { SeoConfig$ } from "#core/constants/seo-config-schema.constant";
import { SeoOptions } from "#core/schemas/seo-options.schema";

// shortcut: registered here until gen writes the package's #stackra/schemas registration (registry gap G1, STA-339).
registerSchemas([[SeoOptions, SeoConfig$]]);

/**
 * The SEO configuration.
 *
 * @example
 * // src/config/seo.config.ts of a web member
 * import { SeoConfig as BaseSeoConfig } from "@stackra/seo";
 *
 * export class SeoConfig extends BaseSeoConfig {
 *   override titleTemplate = "%s · {siteName}";
 *   override robots: BaseSeoConfig["robots"] = { "*": { allow: ["/"], disallow: ["/store?q="] } };
 * }
 */
export class SeoConfig extends Config({ schema: SeoOptions }) {}
