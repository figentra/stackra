/**
 * Stackra file contract:
 * Purpose: `CLIENT_RESULT_INPUT_SCHEMA`, the zod schema of `ClientResultInput`: the run, the tool call and either the
 *          screen's result or a refusal code.
 * Boundary: the stand-in for what gen writes for this package; internal, registered by `ClientResultInput`. Exactly one
 *           of `result` and `refusal` is present.
 * Runtime: isomorphic
 * Governing contract: ADR 0490 (decision 4); STA-1631.
 */
import { publicId } from "@stackra/validation";
import { z } from "zod";

import { CLIENT_TOOL_RESULT_SCHEMA } from "#core/constants/client-tool-result-schema.constant";

/** The shipped `ClientResultInput$`. */
export const CLIENT_RESULT_INPUT_SCHEMA = z
  .object({
    runId: publicId("airun"),
    toolCallId: z.string().min(1).max(128),
    result: CLIENT_TOOL_RESULT_SCHEMA.exactOptional(),
    refusal: z
      .string()
      .regex(/^[a-z][a-z0-9_]{0,63}$/)
      .exactOptional(),
  })
  .refine((input) => (input.result === undefined) !== (input.refusal === undefined), {
    message: "Send exactly one of result and refusal",
  });
