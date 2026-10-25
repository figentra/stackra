/**
 * Stackra file contract:
 * Purpose: unit tests of `findCommand`: the longest matching name wins whatever the list order, the rest of the line
 *          is returned, an option ends the name, and an unknown line names nothing.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (decision 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { findCommand } from "#node/functions/find-command.function";
import type { CliCommand } from "#node/types/cli-command.type";

const command = (name: string): CliCommand => ({
  name,
  summary: name,
  usage: `stackra ${name}`,
  run: async () => 0,
});

const mcp = command("mcp");
const mcpSync = command("mcp sync");
const gen = command("gen");

describe("findCommand", () => {
  it("prefers the longest name, in any order", () => {
    expect(findCommand([mcp, mcpSync], ["mcp", "sync"])).toEqual({ command: mcpSync, rest: [] });
    expect(findCommand([mcpSync, mcp], ["mcp", "sync", "--help"])).toEqual({
      command: mcpSync,
      rest: ["--help"],
    });
  });

  it("returns the arguments after the name", () => {
    expect(findCommand([gen, mcp], ["gen", "--check"])).toEqual({
      command: gen,
      rest: ["--check"],
    });
    expect(findCommand([mcp, mcpSync], ["mcp", "--help"])).toEqual({
      command: mcp,
      rest: ["--help"],
    });
  });

  it("names nothing for an unknown line", () => {
    expect(findCommand([gen, mcpSync], ["deploy"])).toBeUndefined();
    expect(findCommand([mcpSync], ["mcp"])).toBeUndefined();
  });
});
