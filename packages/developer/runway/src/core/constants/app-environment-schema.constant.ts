/**
 * Stackra file contract:
 * Purpose: `APP_ENVIRONMENT_SCHEMA`, one `environments.<env>` block of an app runway: the dev server (port, host,
 *          https, open), the domain, the destination override, the `vars` (public and server), the secret names, the
 *          `config` values, the Workers knobs and the desktop (Electron dev ports, devtools, channel) and mobile (Metro
 *          port, channel, profile) values of that environment.
 * Boundary: internal. Strict at its top: a root key (`deployable`, `isolate`, `group`, `cpu`, `memory`, `instances`)
 *           fails here, because placement is the root runway's alone. The Workers block stays open; the desktop and
 *           mobile blocks are strict. Removed by STA-2028, as no repository set them and nothing read them: `aliases`
 *           (root surface hosts redirect), `e2e` (gen writes the e2e configs, ADR 0295 decision 5), `pwa` (ADR 0326
 *           decision 6), `desktop.rollout` (one staged rollout, ADR 0254 decision 5) and `mobile.devClient` (`easJsonOf`).
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
  destination: z.string().optional(),
  vars: z
    .record(
      z.string().regex(/^[A-Z][A-Z0-9_]*$/, "Expected a SCREAMING_SNAKE name"),
      VAR_VALUE_SCHEMA,
    )
    .optional(),
  secrets: SECRET_NAMES_SCHEMA.optional(),
  config: CONFIG_VALUES_SCHEMA.optional(),
  workers: OPEN_OBJECT_SCHEMA.optional(),
  desktop: z
    .strictObject({
      devtools: z.boolean().optional(),
      remoteDebugPort: PORT_SCHEMA.optional(),
      pkceLoopbackPort: PORT_SCHEMA.optional(),
      channel: z.string().optional(),
    })
    .optional(),
  mobile: z
    .strictObject({
      metroPort: PORT_SCHEMA.optional(),
      channel: z.string().optional(),
      profile: z.string().optional(),
    })
    .optional(),
});
