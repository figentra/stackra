/**
 * Stackra file contract:
 * Purpose: `COLLABORATION_CONFIG_SCHEMA`, the zod schema this package ships for `CollaborationConfig` (exported as
 *          `CollaborationConfig$`): how often a cursor move is sent and how often a co-edited document is saved as a
 *          snapshot while it changes.
 * Boundary: the stand-in for what gen writes for this package. Every field has a default and there is no object-level
 *           refinement, so `.parse({})` gives the full defaults and a host's generated `CollaborationConfig$` extends
 *           it (`shape.x.unwrap().default(...)`). The bounds keep cursor traffic at 60 messages a second or fewer and
 *           a snapshot at least once an hour. The defaults equal `CollaborationOptions`' initializers (tested).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0225 (decision 2).
 */
import { z } from "zod";

// shortcut: authored until gen compiles this package's CollaborationOptions into #stackra/schemas; replace with STA-339.
/** The shipped `CollaborationConfig$`. */
export const COLLABORATION_CONFIG_SCHEMA = z.object({
  cursorIntervalMilliseconds: z.number().int().min(16).max(1000).default(50),
  snapshotIntervalSeconds: z.number().int().min(1).max(3600).default(30),
  presenceHeartbeatSeconds: z.number().int().min(1).max(3600).default(20),
});
