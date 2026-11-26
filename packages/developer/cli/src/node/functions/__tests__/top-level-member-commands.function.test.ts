/**
 * Stackra file contract:
 * Purpose: unit tests of `topLevelMemberCommands`: no manifest is read when the line names a `stackra` command; the
 *          list, an unknown name, help and completion get the member commands; a stackra name or alias is never
 *          taken; a name the console refuses is left out instead of breaking the CLI.
 * Boundary: test only; the workspace is a throwaway folder of manifests.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0506 (decision 6); STA-2888.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { Command, readCommand, type CommandClass } from "@stackra/console";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { topLevelMemberCommands } from "#node/functions/top-level-member-commands.function";

class GenCommand extends Command({
  name: "gen",
  description: "Generate",
  aliases: ["g"],
}) {
  /** Does nothing. */
  async handle(): Promise<number> {
    return 0;
  }
}

/** A manifest `commands` row with the defaults gen writes. */
const row = (name: string, aliases: string[] = []) => ({
  name,
  aliases,
  hidden: false,
  audit: false,
  bin: false,
  class: "Probe",
  file: "src/probe.command.ts",
  entry: "core",
});

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-top-level-"));
  writeFileSync(join(root, "pnpm-workspace.yaml"), "packages:\n  - services/*\n");
  const folder = join(root, "services", "orders");
  mkdirSync(folder, { recursive: true });
  writeFileSync(join(folder, "package.json"), JSON.stringify({ name: "@acme/service-orders" }));
  writeFileSync(join(folder, "stackra.config.ts"), "export default defineService({});\n");
  writeFileSync(
    join(folder, "stackra.manifest.json"),
    JSON.stringify({
      commands: [row("db:status", ["g", "dbs"]), row("gen"), row("help"), row("Bad Name")],
    }),
  );
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

const names = (types: readonly CommandClass[]) => types.map((type) => readCommand(type).name);

describe("topLevelMemberCommands", () => {
  // @covers sta-2888:FR-006
  it("reads nothing when the line names a stackra command or alias", () => {
    expect(topLevelMemberCommands(["gen", "--check"], root, [GenCommand])).toEqual([]);
    expect(topLevelMemberCommands(["--verbose", "g"], root, [GenCommand])).toEqual([]);
  });

  // @covers sta-2888:FR-001
  it("adds the member commands for the list, an unknown name, help and completion", () => {
    for (const argv of [
      [],
      ["db:status"],
      ["db", "status"],
      ["help", "db:status"],
      ["complete", "--", "d"],
    ])
      expect(names(topLevelMemberCommands(argv, root, [GenCommand]))).toEqual(["db:status"]);
  });

  // @covers sta-2888:FR-004
  it("never takes a stackra name, alias or kernel word, and drops a name the console refuses", () => {
    const [status, ...others] = topLevelMemberCommands(["db:status"], root, [GenCommand]);
    expect(others).toEqual([]);
    expect(readCommand(status as CommandClass).aliases).toEqual(["dbs"]);
  });
});
