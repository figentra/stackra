/**
 * Stackra file contract:
 * Purpose: unit tests of `McpProtocolError`: an `Error` carrying its JSON-RPC code and message.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (decision 5).
 */
import { describe, expect, it } from "@stackra/testing";

import { McpProtocolError } from "#node/errors/mcp-protocol.error";

describe("McpProtocolError", () => {
  it("carries the JSON-RPC code", () => {
    const error = new McpProtocolError(-32_602, "Unknown tool: deploy");
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("McpProtocolError");
    expect(error.code).toBe(-32_602);
    expect(error.message).toBe("Unknown tool: deploy");
  });
});
