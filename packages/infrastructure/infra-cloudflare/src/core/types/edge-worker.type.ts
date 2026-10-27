/**
 * Stackra file contract:
 * Purpose: `EdgeWorker`, the `edgeWorker` block of the core stack config as `parseCloudflareStack` returns it (defaults
 *          applied): the OS edge Worker's script, KV namespaces, routes, gradual deployment, locked origins and
 *          signing-key ids.
 * Boundary: type only, inferred from the one schema.
 * Runtime: isomorphic
 * Governing contract: ADR 0437 (decisions 1, 4, 5, 6 and 9).
 */
import type { z } from "zod";

import type { EDGE_WORKER_SCHEMA } from "#core/constants/edge-worker-schema.constant";

/** The edge Worker's stack config. */
export type EdgeWorker = z.output<typeof EDGE_WORKER_SCHEMA>;
