/**
 * Stackra file contract:
 * Purpose: `CLIENT_TOOL_RESULT_SCHEMA`, the zod schema of what a surface reports for a client tool call: whether the
 *          screen did it, and an optional short code.
 * Boundary: the stand-in for what gen writes for this package; internal, registered by `ClientToolResult`. Every client
 *           tool has this one output: a result reports only what the screen did, never data about records (ADR 0490
 *           decision 4), so the note is a machine code, not free text.
 * Runtime: isomorphic
 * Governing contract: ADR 0490 (decision 4); STA-1631.
 */
import { z } from "zod";

/** The shipped `ClientToolResult$`. */
export const CLIENT_TOOL_RESULT_SCHEMA = z.object({
  done: z.boolean(),
  note: z
    .string()
    .regex(/^[a-z][a-z0-9_]{0,63}$/)
    .exactOptional(),
});
