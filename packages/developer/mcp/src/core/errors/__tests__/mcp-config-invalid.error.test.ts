/**
 * Stackra file contract:
 * Purpose: unit tests of `McpConfigInvalidError`: the message names the source and every issue path (the document
 *          itself as `(document)`), and the issues are kept frozen.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (enforcement).
 */
import { describe, expect, it } from "@stackra/testing";

import { McpConfigInvalidError } from "#core/errors/mcp-config-invalid.error";

describe("McpConfigInvalidError", () => {
  it("names the source and each issue", () => {
    const error = new McpConfigInvalidError(".mcp.yaml", [
      { path: "", code: "not_readable", message: "Not YAML" },
      { path: "mcpServers.docs", code: "unpinned_npx_server", message: "pin it" },
    ]);

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("McpConfigInvalidError");
    expect(error.source).toBe(".mcp.yaml");
    expect(error.message).toBe(
      ".mcp.yaml is invalid: (document): Not YAML; mcpServers.docs: pin it",
    );
    expect(Object.isFrozen(error.issues)).toBe(true);
  });
});
