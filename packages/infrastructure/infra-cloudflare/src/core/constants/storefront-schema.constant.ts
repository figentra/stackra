/**
 * Stackra file contract:
 * Purpose: `STOREFRONT_SCHEMA`, a storefront's edge settings for its drops and campaigns: how a shopper is told apart
 *          at the edge (a cookie or header the storefront sets), and per campaign its host and path, an optional
 *          waiting room (active shoppers, new shoppers per minute, session length, the event window, whether it is on)
 *          and per-shopper limits on its hot items (a path prefix, requests per period).
 * Boundary: internal; `parseStorefront` reads it. The values are the tenant's campaign settings, exported by the
 *           storefront for the edge stack; none is typed in code. Strict at every level. The minimums are
 *           Cloudflare's own floors (200 active and 200 new shoppers per minute); the periods are the windows its rate
 *           limiting accepts. Paths are plain URL paths, so no value can break out of a rule expression.
 * Runtime: isomorphic
 * Governing contract: ADR 0402 (waiting room and per-shopper limits as tenant settings), ADR 0217 (decision 2: limits
 *                     at the edge), ADR 0363 (configuration over code).
 */
import { z } from "zod";

import { DNS_LABEL_SCHEMA } from "#core/constants/dns-label-schema.constant";
import { HOSTNAME_SCHEMA } from "#core/constants/hostname-schema.constant";

/** A URL path with no quote, space or wildcard. */
const PATH = z
  .string()
  .regex(/^\/[A-Za-z0-9/_.~-]*$/, "Expected a URL path such as /products/drop-1");

/** An ISO 8601 instant with its offset. */
const INSTANT = z.iso.datetime({ offset: true });

/** One campaign. */
const CAMPAIGN = z.strictObject({
  host: HOSTNAME_SCHEMA,
  path: PATH.default("/"),
  waitingRoom: z
    .strictObject({
      enabled: z.boolean(),
      totalActiveUsers: z.int().min(200),
      newUsersPerMinute: z.int().min(200),
      sessionMinutes: z.int().min(1).max(30).optional(),
      startsAt: INSTANT,
      endsAt: INSTANT,
      prequeueMinutes: z.int().min(1).max(1440).optional(),
    })
    .refine((room) => Date.parse(room.endsAt) > Date.parse(room.startsAt), {
      message: "A waiting room ends after it starts",
      path: ["endsAt"],
    })
    .optional(),
  limits: z
    .array(
      z.strictObject({
        path: PATH,
        requests: z.int().min(1),
        periodSeconds: z.literal([10, 60, 120, 300, 600, 3600]),
      }),
    )
    .default([]),
});

/** A storefront's edge settings, defaults applied. */
export const STOREFRONT_SCHEMA = z.strictObject({
  shopper: z.strictObject({
    by: z.enum(["cookie", "header"]),
    name: z.string().regex(/^[A-Za-z0-9_-]{1,64}$/, "Expected a cookie or header name"),
  }),
  campaigns: z.record(DNS_LABEL_SCHEMA, CAMPAIGN).default({}),
});
