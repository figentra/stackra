/**
 * Stackra file contract:
 * Purpose: `APP_ENVIRONMENT_SCHEMA`, one `environments.<env>` block of an app runway: the dev server (port, host,
 *          https, open, Electron dev ports), the public and server `vars`, the `config` values, the e2e inputs, the
 *          domain and its aliases, the destination override, the Workers knobs and the desktop, mobile and PWA release
 *          values of that environment.
 * Boundary: internal. Strict: a root key (`deployable`, `isolate`, `group`, `cpu`, `memory`, `instances`) fails here,
 *           because placement is the root runway's alone.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (decision 1), ADR 0175 (domains), ADR 0249 (web, PWA and desktop targets), ADR 0254
 *                     (desktop release), ADR 0255 (mobile release).
 */
import { url } from "@stackra/validation";
import { z } from "zod";

import { CONFIG_VALUES_SCHEMA } from "#core/constants/config-values-schema.constant";
import { KEY_SCHEMA } from "#core/constants/key-schema.constant";
import { PORT_SCHEMA } from "#core/constants/port-schema.constant";
import { VAR_VALUE_SCHEMA } from "#core/constants/var-value-schema.constant";

/** A host name, optionally holding the `${pr}` placeholder of a preview environment. */
const HOST = z.string().regex(/^[a-z0-9${}.-]+$/i, "Expected a host name");

/** One app environment. */
export const APP_ENVIRONMENT_SCHEMA = z.strictObject({
  port: PORT_SCHEMA.optional(),
  host: z.string().min(1).optional(),
  https: z.boolean().optional(),
  open: z.boolean().optional(),
  domain: HOST.optional(),
  aliases: z.array(HOST).optional(),
  destination: KEY_SCHEMA.optional(),
  vars: z
    .record(
      z.string().regex(/^[A-Z][A-Z0-9_]*$/, "Expected a SCREAMING_SNAKE name"),
      VAR_VALUE_SCHEMA,
    )
    .optional(),
  config: CONFIG_VALUES_SCHEMA.optional(),
  e2e: z
    .strictObject({
      baseUrl: z.union([z.literal("from-port"), url()]).optional(),
      seeds: z.union([z.literal("from-stackra-config"), z.array(z.string().min(1))]).optional(),
      turnstile: z.literal("test-keys").optional(),
    })
    .optional(),
  desktop: z
    .strictObject({
      devtools: z.boolean().optional(),
      remoteDebugPort: PORT_SCHEMA.optional(),
      pkceLoopbackPort: PORT_SCHEMA.optional(),
      channel: KEY_SCHEMA.optional(),
      rollout: z.strictObject({ startPercent: z.int().min(0).max(100) }).optional(),
    })
    .optional(),
  mobile: z
    .strictObject({
      devClient: z.boolean().optional(),
      channel: KEY_SCHEMA.optional(),
      profile: KEY_SCHEMA.optional(),
    })
    .optional(),
  pwa: z.strictObject({ updates: z.string().min(1) }).optional(),
  workers: z
    .strictObject({
      observability: z.strictObject({ headSamplingRate: z.number().min(0).max(1) }).optional(),
      limits: z.strictObject({ cpuMs: z.int().positive() }).optional(),
    })
    .optional(),
});
