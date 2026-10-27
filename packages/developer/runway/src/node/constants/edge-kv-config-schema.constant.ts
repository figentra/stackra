/**
 * Stackra file contract:
 * Purpose: `EdgeKvConfig$`, the zod shape of `EdgeKvOptions`: a Workers KV namespace id (32 hex digits) or empty.
 * Boundary: internal; `EdgeKvConfig` registers it for `EdgeKvOptions`.
 * Runtime: node
 * Governing contract: ADR 0437 (the KV copy); the STA-339 stand-in for gen's compiled schemas.
 */
import { z } from "zod";

// shortcut: authored until gen compiles EdgeKvOptions into #stackra/schemas; replace with STA-339.
/** The shipped `EdgeKvConfig$`. */
export const EdgeKvConfig$ = z.object({
  namespaceId: z
    .string()
    .regex(/^(|[0-9a-f]{32})$/, "Expected empty or a Workers KV namespace id")
    .default(""),
});
