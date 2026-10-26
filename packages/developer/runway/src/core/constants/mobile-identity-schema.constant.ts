/**
 * Stackra file contract:
 * Purpose: `MOBILE_IDENTITY_SCHEMA`, the `identity` of a mobile app entry: its display name per locale, the iOS
 *          bundle id and team key, the Android package, the URL scheme and the hosts its app links open.
 * Boundary: internal; the mobile app schema composes it. Shape only: that the ids follow
 *           `<prefix>.<product>.<app>` is `checkSurfaces`'s; the team key names a store account, never a secret.
 * Runtime: isomorphic
 * Governing contract: ADR 0439 (decisions 2 and 6: ids frozen at first upload), ADR 0326 (app identity).
 */
import { z } from "zod";

import { HOST_NAME_SCHEMA } from "#core/constants/host-name-schema.constant";

/** A reverse-DNS app id both stores accept (`com.figentra.mezzora.staff`). */
const APP_ID = z
  .string()
  .regex(
    /^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$/,
    "Expected a reverse-DNS app id, such as com.acme.shop.staff",
  );

/** One app's identity. */
export const MOBILE_IDENTITY_SCHEMA = z.strictObject({
  name: z.record(
    z.string().regex(/^[a-z]{2}(-[A-Z]{2})?$/, "Expected a locale, such as en or ar-SA"),
    z.string().min(1),
  ),
  ios: z.strictObject({ bundleId: APP_ID, team: z.string().min(1) }).optional(),
  android: z.strictObject({ package: APP_ID }).optional(),
  scheme: z
    .string()
    .regex(/^[a-z][a-z0-9+.-]*$/, "Expected a lower-case URL scheme")
    .optional(),
  links: z
    .array(HOST_NAME_SCHEMA)
    .refine((hosts) => new Set(hosts).size === hosts.length, "A link host is listed more than once")
    .optional(),
});
