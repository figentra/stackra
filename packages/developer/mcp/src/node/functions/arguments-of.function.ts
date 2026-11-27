/**
 * Stackra file contract:
 * Purpose: `argumentsOf(schema, value)`, the arguments of a local tool call or prompt checked by its zod schema: the
 *          parsed value, or the JSON-RPC invalid-params error (-32602) with zod's readable message. A missing value
 *          is checked as `{}`.
 * Boundary: pure; it runs nothing, so a call is refused before any command or read starts.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5); JSON-RPC 2.0 error codes; STA-2919.
 */
import { z } from "zod";

import { McpProtocolError } from "#node/errors/mcp-protocol.error";

/**
 * `value` checked by `schema`.
 *
 * @param schema - the zod schema of the arguments.
 * @param value - the `arguments` of the request, possibly missing.
 * @throws McpProtocolError (-32602) when the value does not match.
 * @example
 * argumentsOf(LOCAL_TOOLS.gen.input, { check: true }); // { check: true }
 */
export function argumentsOf<T extends z.ZodType>(schema: T, value: unknown): z.infer<T> {
  const result = schema.safeParse(value ?? {});
  if (!result.success) throw new McpProtocolError(-32_602, z.prettifyError(result.error));
  return result.data;
}
