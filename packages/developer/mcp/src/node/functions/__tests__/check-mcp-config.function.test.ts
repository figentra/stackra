/**
 * Stackra file contract:
 * Purpose: unit tests of `checkMcpConfig`: false when `.mcp.json` is missing or drifted, true right after a sync, and
 *          an `McpConfigInvalidError` when `.mcp.yaml` is missing.
 * Boundary: test only; writes throwaway files in the OS temp directory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (decision 10 and enforcement).
 */
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { McpConfigInvalidError } from "#core/errors/mcp-config-invalid.error";
import { checkMcpConfig } from "#node/functions/check-mcp-config.function";
import { syncMcpConfig } from "#node/functions/sync-mcp-config.function";

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-mcp-"));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe("checkMcpConfig", () => {
  it("detects a missing or drifted .mcp.json", () => {
    writeFileSync(
      join(root, ".mcp.yaml"),
      "mcpServers:\n  expo:\n    type: http\n    url: https://mcp.expo.dev/mcp\n",
    );
    expect(checkMcpConfig(root)).toBe(false);

    syncMcpConfig(root);
    expect(checkMcpConfig(root)).toBe(true);

    writeFileSync(join(root, ".mcp.json"), '{"mcpServers":{}}\n');
    expect(checkMcpConfig(root)).toBe(false);
  });

  it("fails when .mcp.yaml is missing", () => {
    expect(() => checkMcpConfig(root)).toThrow(McpConfigInvalidError);
  });
});
