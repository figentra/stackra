/**
 * Stackra file contract:
 * Purpose: `APP_ENVIRONMENT_SCHEMA`, one `environments.<env>` block of an app runway: the dev server (port, host,
 *          https, open), the domain and its aliases, the destination override, the `vars` (public and server), the
 *          secret names, the `config` values, the e2e inputs, the Workers and PWA knobs and the desktop (Electron dev
 *          ports, channel, rollout) and mobile (Metro port, dev client, channel, profile) values of that environment.
 * Boundary: internal. Strict at its top: a root key (`deployable`, `isolate`, `group`, `cpu`, `memory`, `instances`)
 *           fails here, because placement is the root runway's alone. The e2e, Workers, PWA, desktop and mobile
 *           blocks stay open, as the canonical schema leaves them.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (decision 1), ADR 0170 (dev ports written once), ADR 0175 (domains), ADR 0254
 *                     (desktop release), ADR 0180 (mobile release).
 */
import { z } from "zod";

import { CONFIG_VALUES_SCHEMA } from "#core/constants/config-values-schema.constant";
import { OPEN_OBJECT_SCHEMA } from "#core/constants/open-object-schema.constant";
import { PORT_SCHEMA } from "#core/constants/port-schema.constant";
import { SECRET_NAMES_SCHEMA } from "#core/constants/secret-names-schema.constant";
import { VAR_VALUE_SCHEMA } from "#core/constants/var-value-schema.constant";

/** One app environment. */
export const APP_ENVIRONMENT_SCHEMA = z.strictObject({
  port: PORT_SCHEMA.optional(),
  host: z.string().optional(),
  https: z.boolean().optional(),
  open: z.boolean().optional(),
  domain: z.string().optional(),
  aliases: z.array(z.string()).optional(),
  destination: z.string().optional(),
  vars: z
    .record(
      z.string().regex(/^[A-Z][A-Z0-9_]*$/, "Expected a SCREAMING_SNAKE name"),
      VAR_VALUE_SCHEMA,
    )
    .optional(),
  secrets: SECRET_NAMES_SCHEMA.optional(),
  config: CONFIG_VALUES_SCHEMA.optional(),
  e2e: OPEN_OBJECT_SCHEMA.optional(),
  workers: OPEN_OBJECT_SCHEMA.optional(),
  pwa: OPEN_OBJECT_SCHEMA.optional(),
  desktop: z
    .looseObject({
      devtools: z.boolean().optional(),
      remoteDebugPort: PORT_SCHEMA.optional(),
      pkceLoopbackPort: PORT_SCHEMA.optional(),
      channel: z.string().optional(),
      rollout: OPEN_OBJECT_SCHEMA.optional(),
    })
    .optional(),
  mobile: z
    .looseObject({
      metroPort: PORT_SCHEMA.optional(),
      devClient: z.boolean().optional(),
      channel: z.string().optional(),
      profile: z.string().optional(),
    })
    .optional(),
});
