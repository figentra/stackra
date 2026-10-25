/**
 * Stackra file contract:
 * Purpose: unit tests of `syncMcpConfig`: writes `.mcp.json` from `.mcp.yaml`, reports no change when the text already
 *          matches, rewrites a drifted file, and leaves `.mcp.json` alone when `.mcp.yaml` is invalid.
 * Boundary: test only; writes throwaway files in the OS temp directory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (decision 10).
 */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { McpConfigInvalidError } from "#core/errors/mcp-config-invalid.error";
import { syncMcpConfig } from "#node/functions/sync-mcp-config.function";

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-mcp-"));
  writeFileSync(
    join(root, ".mcp.yaml"),
    "mcpServers:\n  stackra:\n    command: pnpm\n    args: [exec, stackra, mcp]\n",
  );
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe("syncMcpConfig", () => {
  it("writes .mcp.json, then reports no change, then repairs drift", () => {
    const file = join(root, ".mcp.json");
    expect(syncMcpConfig(root)).toEqual({ file, changed: true });
    expect(JSON.parse(readFileSync(file, "utf8"))).toEqual({
      mcpServers: { stackra: { command: "pnpm", args: ["exec", "stackra", "mcp"] } },
    });

    expect(syncMcpConfig(root).changed).toBe(false);

    writeFileSync(file, "{}\n");
    expect(syncMcpConfig(root).changed).toBe(true);
  });

  it("leaves .mcp.json alone when .mcp.yaml is invalid", () => {
    writeFileSync(join(root, ".mcp.json"), "{}\n");
    writeFileSync(join(root, ".mcp.yaml"), "mcpServers:\n  Bad:\n    command: x\n");
    expect(() => syncMcpConfig(root)).toThrow(McpConfigInvalidError);
    expect(readFileSync(join(root, ".mcp.json"), "utf8")).toBe("{}\n");
  });
});
