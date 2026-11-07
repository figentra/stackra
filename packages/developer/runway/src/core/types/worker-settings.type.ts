/**
 * Stackra file contract:
 * Purpose: `WorkerSettings`, the operational settings of one Worker layer.
 * Boundary: internal; see `workerSettingsOf`.
 * Runtime: isomorphic
 * Governing contract: ADR 0519 (decision 2); STA-1988.
 */
import type { z } from "zod";

import type { WORKER_SETTINGS_SCHEMA } from "#core/constants/worker-settings-schema.constant";

/** The settings of a layer. */
export type WorkerSettings = z.output<typeof WORKER_SETTINGS_SCHEMA>;
