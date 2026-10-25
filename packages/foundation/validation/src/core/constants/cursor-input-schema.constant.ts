/**
 * Stackra file contract:
 * Purpose: `CURSOR_INPUT_SCHEMA`, the zod schema of `CursorInput` that this package ships (its `X$`): an optional
 *          cursor and a limit from 1 to 100, 20 by default.
 * Boundary: the stand-in for what gen will write for this package; generated schemas of a subclass inline the same
 *           two fields. Internal: `cursor-input.schema.ts` registers it, and it is not exported from the entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); the HTTP conventions (cursor pagination).
 */
import { z } from "zod";

/** The shipped `CursorInput$`: an optional cursor and a limit of 1 to 100. */
export const CURSOR_INPUT_SCHEMA = z.object({
  cursor: z.string().exactOptional(),
  limit: z.number().int().min(1).max(100).default(20),
});
