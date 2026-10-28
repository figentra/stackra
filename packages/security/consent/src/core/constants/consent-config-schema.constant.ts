/**
 * Stackra file contract:
 * Purpose: `CONSENT_CONFIG_SCHEMA`, the zod schema this package ships for `ConsentConfig` (exported as
 *          `ConsentConfig$`): the categories, the decision cookie's name and lifetime, the policy version, the regime
 *          per region, the first-launch prompt, and the signed consent snapshot's lifetime and clock skew (ADR 0472).
 * Boundary: the stand-in for what gen writes for this package. Every field has a default and there is no object-level
 *           refinement, so `.parse({})` gives the full defaults and a member's generated `ConsentConfig$` extends it
 *           (`ConsentConfig$.shape.categories.unwrap().default(...)`). The rules sit on the fields: a required
 *           category is granted by default, a category appears once, the cookie name is a cookie token, and a
 *           decision lives at most 400 days (the longest cookie lifetime browsers keep); a snapshot lives 5 minutes to
 *           7 days (default a day) and tolerates up to 5 minutes of clock skew. The defaults equal
 *           `ConsentOptions`' initializers (tested).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0298 (decisions 1, 3 and 4); ADR 0472
 *                     (decision 2: the snapshot's lifetime is a consent setting).
 */
import { Enum } from "@stackra/contracts";
import { z } from "zod";

import { ConsentCategory } from "#core/enums/consent-category.enum";
import { ConsentRegime } from "#core/enums/consent-regime.enum";

/** One `ConsentCategoryEntry`. */
const CATEGORY_ENTRY = z
  .object({
    category: z.enum(Enum.values(ConsentCategory)),
    required: z.boolean(),
    defaultGranted: z.boolean(),
    descriptionKey: z.string().min(1).nullable().default(null),
  })
  .refine((entry) => !entry.required || entry.defaultGranted, {
    message: "A required consent category is granted by default",
    path: ["defaultGranted"],
  });

/** An RFC 6265 cookie-name token: no separators, spaces or controls. */
const COOKIE_NAME = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;

// shortcut: authored until gen compiles this package's ConsentOptions into #stackra/schemas; replace it with STA-339.
/** The shipped `ConsentConfig$`. */
export const CONSENT_CONFIG_SCHEMA = z.object({
  categories: z
    .array(CATEGORY_ENTRY)
    .refine((list) => new Set(list.map((entry) => entry.category)).size === list.length, {
      message: "A consent category is listed once",
    })
    .default(() => [
      {
        category: ConsentCategory.Necessary,
        required: true,
        defaultGranted: true,
        descriptionKey: null,
      },
    ]),
  cookieName: z.string().regex(COOKIE_NAME).default("consent"),
  expiryDays: z.number().int().min(1).max(400).default(180),
  policyVersion: z.string().min(1).default("1"),
  regionDefaults: z
    .record(z.string().min(1), z.enum(Enum.values(ConsentRegime)))
    .default(() => ({})),
  askOnFirstLaunch: z.boolean().default(false),
  snapshotLifetimeMinutes: z.number().int().min(5).max(10_080).default(1440),
  snapshotClockSkewSeconds: z.number().int().min(0).max(300).default(60),
});
