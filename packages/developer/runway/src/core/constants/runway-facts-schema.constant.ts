/**
 * Stackra file contract:
 * Purpose: `RUNWAY_FACTS_SCHEMA`, the resolved runway facts the readers answer from: the environment, the dev lane,
 *          the desktop feed origin, the dev infra ports (the gateway) and, per member, its dev origin, port, host,
 *          https and TLS files, Electron dev ports and desktop feed path and channel, the product (an edition's base) and a member's brands. `stackra dev` writes it as
 *          `.stackra/dev/ports.json` (lane offsets applied); `definesFor` injects one member's public part into a
 *          bundle as `__STACKRA_RUNWAY__`.
 * Boundary: internal. Resolved values only: no `ref:`, no `${pr}`, no secret. The TLS paths name files on the
 *           developer's machine and never reach a bundle.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (decision 1: the dev port is written once, in the member runway), ADR 0254 (the
 *                     feed), ADR 0295 (decision 5: generated tool configs read it).
 */
import { Enum } from "@stackra/contracts";
import { url } from "@stackra/validation";
import { z } from "zod";

import { BRAND_SCHEMA } from "#core/constants/brand-schema.constant";
import { KEY_SCHEMA } from "#core/constants/key-schema.constant";
import { PORT_SCHEMA } from "#core/constants/port-schema.constant";
import { PRODUCT_SCHEMA } from "#core/constants/product-schema.constant";
import { RunwayEnvironment } from "#core/enums/runway-environment.enum";

/** The resolved facts of a repository (dev) or of one member's bundle. */
export const RUNWAY_FACTS_SCHEMA = z.object({
  version: z.literal(1),
  environment: z
    .enum(Enum.values(RunwayEnvironment) as [RunwayEnvironment, ...RunwayEnvironment[]])
    .default("dev"),
  lane: z.int().min(0).default(0),
  feedOrigin: url().optional(),
  product: PRODUCT_SCHEMA.optional(),
  infra: z.record(KEY_SCHEMA, z.object({ port: PORT_SCHEMA, url: url() })).default({}),
  members: z
    .record(
      KEY_SCHEMA,
      z.object({
        url: url().optional(),
        port: PORT_SCHEMA.optional(),
        host: z.string().min(1).optional(),
        https: z.boolean().default(false),
        open: z.boolean().default(false),
        tls: z.object({ cert: z.string().min(1), key: z.string().min(1) }).optional(),
        desktop: z
          .object({
            devtools: z.boolean().optional(),
            remoteDebugPort: PORT_SCHEMA.optional(),
            pkceLoopbackPort: PORT_SCHEMA.optional(),
          })
          .default({}),
        brands: z.array(BRAND_SCHEMA).optional(),
        feed: z.object({ path: z.string().min(1), channel: z.string().min(1) }).optional(),
      }),
    )
    .default({}),
});
