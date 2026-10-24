/**
 * Stackra file contract:
 * Purpose: unit tests of `helpText`: the synopsis, one aligned line per command in order, and the closing hint.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (decision 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { helpText } from "#node/functions/help-text.function";
import type { CliCommand } from "#node/types/cli-command.type";

const command = (name: string, summary: string): CliCommand => ({
  name,
  summary,
  usage: `stackra ${name}`,
  run: async () => 0,
});

describe("helpText", () => {
  it("lists every command aligned, in order", () => {
    const text = helpText([command("gen", "Generate"), command("mcp sync", "Render .mcp.json")]);
    expect(text).toBe(
      [
        "Usage: stackra <command> [options]",
        "",
        "Commands:",
        "  gen       Generate",
        "  mcp sync  Render .mcp.json",
        "",
        "Run `stackra <command> --help` for a command's options; `stackra --version` for the version.",
        "",
      ].join("\n"),
    );
  });
});
