/**
 * Stackra file contract:
 * Purpose: `HTTP_CONFIG_SCHEMA`, the zod schema this package ships for `HttpConfig` (exported as `HttpConfig$`): the
 *          largest request body a generated HTTP adapter reads, in bytes, the drain deadline, in seconds, and the
 *          load-shedding bulkhead (calls at once, calls queued, the queue wait in milliseconds).
 * Boundary: the stand-in for what gen writes for this package. Each field has a default and there is no object-level
 *           refinement, so `.parse({})` gives the full defaults. The defaults equal `HttpOptions`' initializers (tested).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0237 (STA-2577 note: raw adapters);
 *                     ADR 0143 (decision 3: draining timeouts); STA-1467 (load shedding).
 */
import { z } from "zod";

// shortcut: authored until gen compiles this package's HttpOptions into #stackra/schemas; replace with STA-339.
/** The shipped `HttpConfig$`. */
export const HTTP_CONFIG_SCHEMA = z.object({
  maxBodyBytes: z.number().int().min(1).max(104_857_600).default(1_048_576),
  drainTimeoutSeconds: z.number().int().min(1).max(600).default(20),
  maxConcurrentCalls: z.number().int().min(0).max(1_000_000).default(1024),
  maxQueuedCalls: z.number().int().min(0).max(1_000_000).default(1024),
  maxQueueWaitMs: z.number().int().min(0).max(60_000).default(5000),
});
