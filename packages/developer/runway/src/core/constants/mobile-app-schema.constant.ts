/**
 * Stackra file contract:
 * Purpose: `MOBILE_APP_SCHEMA`, one `mobile.<app>` entry of the root runway, and the shape a white-label app built
 *          from tenant data takes: the template line, the packages, the `assets` and `store` folders, the identity,
 *          the capabilities its build switches on, the store accounts it publishes under, the EAS project and channel,
 *          and the product's own app member with its ADR, when one serves it.
 * Boundary: internal; the root runway schema composes it. Strict. Whether the template line offers each capability is
 *           the template's build check; paths under the assets root and the app id pattern are `checkSurfaces`'s.
 * Runtime: isomorphic
 * Governing contract: ADR 0439 (decisions 1 to 3, 6 to 8), ADR 0441 (decision 3), ADR 0442 (decisions 2, 3 and 8).
 */
import { z } from "zod";

import { APP_MEMBER_REFERENCE_SCHEMA } from "#core/constants/app-member-reference-schema.constant";
import { ASSET_PATH_SCHEMA } from "#core/constants/asset-path-schema.constant";
import { MOBILE_IDENTITY_SCHEMA } from "#core/constants/mobile-identity-schema.constant";
import { PACKAGE_LIST_SCHEMA } from "#core/constants/package-list-schema.constant";
import { SHELL_LINE_SCHEMA } from "#core/constants/shell-line-schema.constant";

/** A store account key (`figentra`, or a merchant Connection's key). */
const STORE_ACCOUNT = z.strictObject({
  account: z.string().regex(/^[a-z][a-z0-9-]*$/, "Expected a lower-case account key"),
});

/** One mobile app. */
export const MOBILE_APP_SCHEMA = z.strictObject({
  template: SHELL_LINE_SCHEMA,
  packages: PACKAGE_LIST_SCHEMA.optional(),
  assets: ASSET_PATH_SCHEMA,
  store: ASSET_PATH_SCHEMA,
  identity: MOBILE_IDENTITY_SCHEMA,
  capabilities: z
    .array(
      z
        .string()
        .regex(
          /^[a-z][a-z0-9-]*(:[a-z][a-z0-9-]*)?$/,
          "Expected a capability flag, such as scanner or device:sunmi",
        ),
    )
    .refine(
      (flags) => new Set(flags).size === flags.length,
      "A capability is listed more than once",
    )
    .optional(),
  stores: z
    .strictObject({ apple: STORE_ACCOUNT.optional(), google: STORE_ACCOUNT.optional() })
    .optional(),
  eas: z.strictObject({
    project: z.string().min(1),
    channel: z
      .string()
      .regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/, "Expected an EAS channel name")
      .optional(),
  }),
  app: APP_MEMBER_REFERENCE_SCHEMA.optional(),
});
