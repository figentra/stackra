/**
 * Stackra file contract:
 * Purpose: unit tests of `readMcpConfig`: a block-style `.mcp.yaml` with flow-sequence args is read and checked; a
 *          missing file, YAML with a duplicate key and a broken rule each fail as `McpConfigInvalidError` naming the
 *          file.
 * Boundary: test only; writes throwaway files in the OS temp directory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (decisions 9 and 10).
 */
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { McpConfigInvalidError } from "#core/errors/mcp-config-invalid.error";
import { readMcpConfig } from "#node/functions/read-mcp-config.function";

let directory: string;

beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), "stackra-mcp-"));
});

afterEach(() => {
  rmSync(directory, { recursive: true, force: true });
});

/** Writes `.mcp.yaml` with the given lines and returns its path. */
function configFile(...lines: string[]): string {
  const file = join(directory, ".mcp.yaml");
  writeFileSync(file, `${lines.join("\n")}\n`);
  return file;
}

describe("readMcpConfig", () => {
  it("reads and checks a .mcp.yaml", () => {
    const file = configFile(
      "mcpServers:",
      "  stackra:",
      "    command: pnpm",
      "    args: [exec, stackra, mcp]",
      "  linear:",
      "    type: http",
      "    url: https://mcp.linear.app/mcp",
    );
    expect(readMcpConfig(file)).toEqual({
      mcpServers: {
        stackra: { command: "pnpm", args: ["exec", "stackra", "mcp"] },
        linear: { type: "http", url: "https://mcp.linear.app/mcp" },
      },
    });
  });

  it("fails naming the file when it is missing, not YAML or invalid", () => {
    expect(() => readMcpConfig(join(directory, "absent.yaml"))).toThrow(McpConfigInvalidError);

    const duplicate = configFile("mcpServers: {}", "mcpServers: {}");
    expect(() => readMcpConfig(duplicate)).toThrow(/Not readable as YAML/);

    const unpinned = configFile(
      "mcpServers:",
      "  docs:",
      "    command: npx",
      "    args: [-y, docs-mcp]",
    );
    expect(() => readMcpConfig(unpinned)).toThrow(`${unpinned} is invalid`);
  });
});
