/**
 * Stackra file contract:
 * Purpose: `CLOUDFLARE_STACK_SCHEMA`, the core stack's Cloudflare config, the facts the root runway does not hold yet:
 *          the dev zone, each zone's options (plan, edge, SaaS fallback origin, records, Worker domains), the R2
 *          buckets with their expiry (the Turborepo cache), the dev tunnels by label and the Access gate (GitHub
 *          organisation, identity provider, operator surfaces, bypassed paths, service tokens).
 * Boundary: internal; `parseCloudflareStack` reads it. Names and ids only: no API token, tunnel token or service-token
 *           secret ever sits here. `identityProviderId` may be a `ref:` value, resolved from Pulumi stack config.
 * Runtime: isomorphic
 * Governing contract: ADR 0171 (decision 6: the core stack), ADR 0026 (the R2 cache and its expiry), ADR 0290
 *                     (decisions 1 to 6, 11 and 15), ADR 0289 (decision 4: tunnels as a runway kind).
 */
import { z } from "zod";

import { DNS_LABEL_SCHEMA } from "#core/constants/dns-label-schema.constant";
import { HOSTNAME_SCHEMA } from "#core/constants/hostname-schema.constant";
import { ZONE_OPTIONS_SCHEMA } from "#core/constants/zone-options-schema.constant";

/** A public value, or `ref:<path>` resolved from Pulumi stack config at infra time (ADR 0171). */
const VALUE = z.union([z.string().min(1), z.number(), z.boolean()]);

/** The core stack's Cloudflare config, defaults applied. */
export const CLOUDFLARE_STACK_SCHEMA = z
  .strictObject({
    /** The zone dev tunnels and the dev Access application live on (figentra.cloud, ADR 0290 decision 1). */
    devZone: HOSTNAME_SCHEMA.optional(),
    zones: z.record(HOSTNAME_SCHEMA, ZONE_OPTIONS_SCHEMA).default({}),
    /** R2 bucket name → its lifecycle; the Turborepo cache expires after 7 days (ADR 0026). */
    buckets: z
      .record(DNS_LABEL_SCHEMA, z.strictObject({ expireDays: z.int().min(1).optional() }))
      .default({}),
    /** The `<dev>` label of each machine's named tunnel → the members it exposes (all with a dev port when absent). */
    tunnels: z
      .record(DNS_LABEL_SCHEMA, z.strictObject({ members: z.array(z.string().min(1)).optional() }))
      .default({}),
    access: z
      .strictObject({
        githubOrganization: z.string().min(1),
        identityProviderId: VALUE,
        sessionDuration: z
          .string()
          .regex(/^\d+[hm]$/, "Expected hours or minutes, such as 24h")
          .default("24h"),
        /** Production operator surfaces behind Access, such as `api.figentra.com/platform` (ADR 0290 decision 11). */
        operatorUris: z.array(z.string().min(1)).default([]),
        /** Callback and webhook paths that skip Access, such as `*.figentra.cloud/api/auth/callback`. */
        bypass: z.array(z.string().min(1)).default([]),
        /** Machine names that get an Access service token (ADR 0290 decision 6). */
        serviceTokens: z.array(DNS_LABEL_SCHEMA).default([]),
      })
      .optional(),
  })
  .superRefine((stack, context) => {
    if (stack.devZone === undefined && (Object.keys(stack.tunnels).length > 0 || stack.access))
      context.addIssue({
        code: "custom",
        path: ["devZone"],
        message: "Tunnels and Access need the dev zone (ADR 0290 decision 1)",
      });
    for (const [zone, options] of Object.entries(stack.zones)) {
      const outside = (host: string) => host !== zone && !host.endsWith(`.${zone}`);
      for (const host of Object.keys(options.workers).filter(outside))
        context.addIssue({
          code: "custom",
          path: ["zones", zone, "workers", host],
          message: `${host} is not under ${zone}`,
        });
      if (options.fallbackOrigin !== undefined && outside(options.fallbackOrigin))
        context.addIssue({
          code: "custom",
          path: ["zones", zone, "fallbackOrigin"],
          message: `${options.fallbackOrigin} is not under ${zone}`,
        });
    }
  });
