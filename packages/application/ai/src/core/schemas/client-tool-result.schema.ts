/**
 * Stackra file contract:
 * Purpose: `ClientToolResult`, what a screen reports for a client tool call: whether it did what the tool asked, and
 *          an optional short code.
 * Boundary: a shape class; it registers this package's own schema for itself when the module loads. It reports only
 *           what the screen did, never data about records (ADR 0490 decision 4), so the note is a machine code.
 * Runtime: isomorphic
 * Governing contract: ADR 0490 (decision 4); ADR 0305 (one declaration per file); STA-1631.
 */
import { registerSchemas, Schema } from "@stackra/validation";

import { CLIENT_TOOL_RESULT_SCHEMA } from "#core/constants/client-tool-result-schema.constant";

/**
 * One screen's result.
 *
 * @example
 * ClientToolResult.create({ done: false, note: "filter_unknown" });
 */
export class ClientToolResult extends Schema {
  /** Whether the screen did what the tool asked. */
  done!: boolean;

  /** A short machine code (`filter_unknown`). */
  note?: string;
}

registerSchemas([[ClientToolResult, CLIENT_TOOL_RESULT_SCHEMA]]);
