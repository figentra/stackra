/**
 * Stackra file contract:
 * Purpose: `EDGE_WORKER_SCHEMA`, the `edgeWorker` block of the core stack config: the OS edge Worker's name, its KV
 *          namespaces (each with an optional data-localisation jurisdiction), its routes per zone, its gradual
 *          deployment (one or two versions and their traffic shares), the regional API origins it alone may reach
 *          (tunnel or mTLS) and the ids of the two active edge-signing keys.
 * Boundary: internal; the stack schema composes it. Names, ids and shares only: no signing secret, tunnel token or
 *           service-token secret sits here. The Worker's code and bindings deploy from CI with wrangler (ADR 0284
 *           decision 6); the share steps and rollback threshold are OS settings the deploy job writes here.
 * Runtime: isomorphic
 * Governing contract: ADR 0437 (decisions 1, 4, 5, 6 and 9), ADR 0284 (decision 6), ADR 0353 (data residency).
 */
import { Enum } from "@stackra/contracts";
import { z } from "zod";

import { DNS_LABEL_SCHEMA } from "#core/constants/dns-label-schema.constant";
import { HOSTNAME_SCHEMA } from "#core/constants/hostname-schema.constant";
import { OriginLock } from "#core/enums/origin-lock.enum";

/** One regional API origin the Worker proxies `/api/*` to. */
const ORIGIN = z
  .strictObject({
    /** The origin host the Worker calls, such as `api-me-central.figentra.com`; under a runway zone. */
    hostname: HOSTNAME_SCHEMA,
    lock: z.enum(Enum.values(OriginLock) as [OriginLock, ...OriginLock[]]),
    /** The tunnel's local service, such as `http://localhost:4000`; tunnel lock only. */
    service: z.url().optional(),
  })
  .refine((origin) => (origin.lock === OriginLock.Tunnel) === (origin.service !== undefined), {
    message: "A tunnel origin names its local service; an mTLS origin names none",
    path: ["service"],
  });

/** The `edgeWorker` block, defaults applied. */
export const EDGE_WORKER_SCHEMA = z.strictObject({
  /** The Worker script name, such as `figentra-edge` (ADR 0437 decision 1). */
  script: DNS_LABEL_SCHEMA,
  /** KV namespace label → its options; one `edge` namespace holds every key family by default (ADR 0437 decision 6). */
  namespaces: z
    .record(
      DNS_LABEL_SCHEMA,
      z.strictObject({
        /** Keeps the namespace's data inside a jurisdiction Cloudflare offers (`eu`, `fedramp`). */
        jurisdiction: z.string().min(1).optional(),
      }),
    )
    .default({ edge: {} }),
  /** Zone → the route patterns the Worker serves there, such as `*.shop.figentra.com/*`, or `*\/*` on a SaaS zone. */
  routes: z.record(HOSTNAME_SCHEMA, z.array(z.string().min(1)).min(1)).default({}),
  /** The gradual deployment: the versions wrangler uploaded and their traffic shares (ADR 0437 decision 9). */
  rollout: z
    .array(z.strictObject({ version: z.string().min(1), percent: z.number().min(0).max(100) }))
    .min(1)
    .max(2)
    .refine((versions) => versions.reduce((sum, entry) => sum + entry.percent, 0) === 100, {
      message: "The shares add up to 100",
    })
    .refine(
      (versions) => new Set(versions.map((entry) => entry.version)).size === versions.length,
      {
        message: "Each version appears once",
      },
    )
    .optional(),
  /** Region label → its API origin (ADR 0437 decision 5). */
  origins: z.record(DNS_LABEL_SCHEMA, ORIGIN).default({}),
  /** The active signing-key ids, newest first: the Worker signs with the first, the API accepts both (decision 4). */
  signingKeys: z
    .array(DNS_LABEL_SCHEMA)
    .min(1)
    .max(2)
    .refine((keys) => new Set(keys).size === keys.length, { message: "Each key id appears once" }),
});
