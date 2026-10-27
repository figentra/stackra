/**
 * Stackra file contract:
 * Purpose: `ConsentOptions`, the shape of `ConsentConfig`: the categories a visitor decides on, where and how long the
 *          decision is kept, the policy version that invalidates old decisions, the regime per region and whether a
 *          device app asks on its first launch.
 * Boundary: a shape class; it registers this package's own schema (`CONSENT_CONFIG_SCHEMA`) for itself when the module
 *           loads, so `buildConfig(ConsentConfig)` validates with no generated file. The defaults decline: only
 *           `necessary` is listed and no region has a regime.
 * Runtime: isomorphic
 * Governing contract: ADR 0298 (decisions 1, 3 and 4); ADR 0294 (decisions 19 and 26).
 */
import { Field, Int, registerSchemas, Schema } from "@stackra/validation";

import { CONSENT_CONFIG_SCHEMA } from "#core/constants/consent-config-schema.constant";
import { ConsentCategory } from "#core/enums/consent-category.enum";
import type { ConsentRegime } from "#core/enums/consent-regime.enum";
import type { ConsentCategoryEntry } from "#core/types/consent-category-entry.type";

/**
 * The consent settings.
 *
 * @example
 * export class ConsentConfig extends BaseConsentConfig {
 *   override policyVersion = "2026-10";
 * }
 */
export class ConsentOptions extends Schema {
  /** The categories, in the order the banner and settings show them; `necessary` first and required. */
  // reason: an entry is a package interface with no `X$`; the shipped schema already holds its rules
  @Field(CONSENT_CONFIG_SCHEMA.shape.categories)
  categories: ConsentCategoryEntry[] = [
    {
      category: ConsentCategory.Necessary,
      required: true,
      defaultGranted: true,
      descriptionKey: null,
    },
  ];

  /** How long a decision is kept, in days (1 to 400). */
  @Int({
    min: 1,
    max: 400,
  })
  expiryDays = 180;

  /** The cookie that holds the decision on the web; the only cookie set before a decision. */
  cookieName = "consent";

  /** The consent policy version; a stored decision for another version reads as undecided, so bumping it asks again. */
  policyVersion = "1";

  /** Region code to the regime its visitors get before deciding; `default` covers the rest; none means decline. */
  regionDefaults: Record<string, ConsentRegime> = {};

  /** A device app asks on its first signed-in launch, before any optional category runs. */
  askOnFirstLaunch = false;
}

registerSchemas([[ConsentOptions, CONSENT_CONFIG_SCHEMA]]);
