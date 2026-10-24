/**
 * Stackra file contract:
 * Purpose: unit tests of `renderMcpJson`: two-space JSON with a final newline, holding `mcpServers` only, servers in
 *          file order, which parses back to the same document.
 * Boundary: test only; pure values.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (decision 10).
 */
import { describe, expect, it } from "@stackra/testing";

import { renderMcpJson } from "#core/functions/render-mcp-json.function";

describe("renderMcpJson", () => {
  it("renders Claude Code's .mcp.json text", () => {
    const config = {
      mcpServers: {
        stackra: { command: "pnpm", args: ["exec", "stackra", "mcp"] },
        linear: { type: "http" as const, url: "https://mcp.linear.app/mcp" },
      },
    };
    const text = renderMcpJson(config);

    expect(text.endsWith("}\n")).toBe(true);
    expect(text.startsWith('{\n  "mcpServers": {\n    "stackra": {')).toBe(true);
    expect(JSON.parse(text)).toEqual(config);
  });
});
