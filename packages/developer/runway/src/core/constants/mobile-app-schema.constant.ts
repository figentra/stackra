/**
 * Stackra file contract:
 * Purpose: `MOBILE_APP_SCHEMA`, one app of the root runway's `mobile` (staff, shopper, …): the template line, the
 *          product packages, the `assets` and `store` paths under `assets/`, the identity (localised name, iOS and
 *          Android ids, scheme, app links), the capability flags, tablet support, the social sign-in providers, the
 *          store accounts, the EAS project and channel, and its per-tenant white-label variants.
 * Boundary: internal; the root runway schema composes it. Strict at its top and in `identity`; the store and EAS
 *           blocks stay open for their drivers. Capability names are the template's flags, not checked here; the
 *           build strips what an app does not list (ADR 0439). Every app ships to iOS, so a social sign-in list
 *           without `apple` is refused (App Store guideline 4.8).
 * Runtime: isomorphic
 * Governing contract: ADR 0441 (decision 3), ADR 0439 (capability flags, tenant-started builds), app-shells D13 and
 *                     D14, STA-1578 (App Store guideline 4.8: Sign in with Apple beside every social sign-in).
 */
import { z } from "zod";

import { ASSET_PATH_SCHEMA } from "#core/constants/asset-path-schema.constant";
import { PACKAGE_NAME_SCHEMA } from "#core/constants/package-name-schema.constant";
import { SHELL_LINE_SCHEMA } from "#core/constants/shell-line-schema.constant";
import { WHITE_LABEL_SCHEMA } from "#core/constants/white-label-schema.constant";

/** A store account reference. */
const STORE_ACCOUNT = z.looseObject({ account: z.string().optional() });

/**
 * The social sign-in providers an app offers (`@stackra/identity`'s `externalProviders` keys). A national ID service is
 * not social and is not listed here (guideline 4.8 exempts it).
 */
const SIGN_IN = z.strictObject({
  social: z
    .array(z.string().regex(/^[a-z][a-z0-9_]*$/, "Expected a snake_case provider key"))
    .refine(
      (providers) => new Set(providers).size === providers.length,
      "A provider is listed more than once",
    )
    .refine(
      (providers) => providers.length === 0 || providers.includes("apple"),
      "An iOS app that offers social sign-in must offer Sign in with Apple too (App Store guideline 4.8): add apple",
    ),
});

/** One mobile app. */
export const MOBILE_APP_SCHEMA = z.strictObject({
  template: SHELL_LINE_SCHEMA,
  packages: z.array(PACKAGE_NAME_SCHEMA).optional(),
  assets: ASSET_PATH_SCHEMA.optional(),
  store: ASSET_PATH_SCHEMA.optional(),
  identity: z
    .strictObject({
      name: z.record(z.string(), z.string()).optional(),
      ios: z
        .looseObject({
          bundleId: z
            .string()
            .regex(/^[A-Za-z][A-Za-z0-9-]*(\.[A-Za-z][A-Za-z0-9-]*)+$/, "Expected a bundle id")
            .optional(),
          team: z.string().optional(),
        })
        .optional(),
      android: z
        .looseObject({
          package: z
            .string()
            .regex(/^[A-Za-z][A-Za-z0-9_]*(\.[A-Za-z][A-Za-z0-9_]*)+$/, "Expected a package id")
            .optional(),
        })
        .optional(),
      scheme: z
        .string()
        .regex(/^[a-z][a-z0-9+.-]*$/, "Expected a lower-case URL scheme")
        .optional(),
      links: z.array(z.string()).optional(),
    })
    .optional(),
  capabilities: z
    .array(z.string().regex(/^[a-z][a-z0-9-]*$/, "Expected a lower-case capability flag"))
    .refine(
      (flags) => new Set(flags).size === flags.length,
      "A capability is listed more than once",
    )
    .optional(),
  tablet: z.boolean().optional(),
  signIn: SIGN_IN.optional(),
  stores: z
    .looseObject({ apple: STORE_ACCOUNT.optional(), google: STORE_ACCOUNT.optional() })
    .optional(),
  eas: z.looseObject({ project: z.string().optional(), channel: z.string().optional() }).optional(),
  whiteLabel: WHITE_LABEL_SCHEMA.optional(),
});
