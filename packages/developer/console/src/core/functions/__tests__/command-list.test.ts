/**
 * Stackra file contract:
 * Purpose: proves the command list through the kernel: headings in `ConsoleConfig.groups` order (the rest
 *          alphabetically), commands `ConsoleConfig.unlisted` names left out of the list, its `--json` data and tab
 *          completion while still running by name, the `list --all` hint, the built-in `list` and `list --all` (hidden
 *          commands included, their `--json` rows keeping the real `hidden` value), a usage error for anything else after `list`, and a registered `list` command winning.
 * Boundary: unit test in-process; no terminal.
 * Runtime: node
 * Governing contract: STA-2872 spec FR-001 to FR-003; ADR 0022.
 */
// @covers sta-2872:FR-001 sta-2872:FR-002 sta-2872:FR-003
import { Command } from "#core/bases/command.base";
import type { CommandStructure } from "#contracts/types/command-structure.type";
import type { ConsoleConfig } from "#core/types/console-config.type";
import { TabCompletionsDriver } from "#node/drivers/tab-completions.driver";
import { runCommandForTest } from "#testing/functions/run-command-for-test.function";

/** A command that answers with its own name. */
const make = (name: string, options: { group?: string; hidden?: boolean } = {}) =>
  class extends Command({
    name,
    description: `Run ${name}`,
    ...options,
  }) {
    handle() {
      return { ran: name };
    }
  };

const COMMANDS = [
  make("about"),
  make("make:model", { group: "Create" }),
  make("serve", { group: "Develop" }),
  make("db:migrate"),
  make("cycles", { group: "Repository" }),
  make("plumbing", { group: "Develop", hidden: true }),
  make("zebra", { group: "Animals" }),
];

/** The Repository group is left out, as a CLI does outside its own repository. */
const unlisted = (structure: CommandStructure) => structure.group === "Repository";

const config = (extra: Partial<ConsoleConfig> = {}): ConsoleConfig => ({
  name: "acme",
  version: "1.0.0",
  commands: COMMANDS,
  ...extra,
});

/** The headings of a text list, in the order they are drawn. */
const headings = (stdout: string) =>
  stdout
    .split("\n")
    .filter((line) => /^ \S/.test(line))
    .map((line) => line.trim());

/** The command names a `--json` list holds. */
const listed = (stdout: string) =>
  (JSON.parse(stdout) as { data: { name: string }[] }).data.map((row) => row.name).toSorted();

describe("the command list", () => {
  it("draws ungrouped commands first, then the named headings in order, then the rest alphabetically", async () => {
    const result = await runCommandForTest(
      config({ groups: ["Develop", "Create", "Repository"] }),
      [],
    );
    expect(result.exitCode).toBe(0);
    expect(headings(result.stdout)).toEqual(["Develop", "Create", "Repository", "Animals", "db"]);
    expect(result.stdout.indexOf("about")).toBeLessThan(result.stdout.indexOf(" Develop"));
  });

  it("keeps the alphabetical headings without groups", async () => {
    const result = await runCommandForTest(config(), []);
    expect(headings(result.stdout)).toEqual(["Animals", "Create", "db", "Develop", "Repository"]);
  });

  it("leaves out what unlisted names and says how many `list --all` adds", async () => {
    const result = await runCommandForTest(config({ unlisted }), []);
    expect(result.stdout).not.toContain("cycles");
    expect(result.stdout).not.toContain("plumbing");
    expect(headings(result.stdout)).not.toContain("Repository");
    expect(result.stdout).toContain('Run "acme list --all" for every command (2 more).');
  });

  it("leaves unlisted commands out of the --json list too", async () => {
    const result = await runCommandForTest(config({ unlisted }), ["--json"]);
    expect(listed(result.stdout)).toEqual(["about", "db:migrate", "make:model", "serve", "zebra"]);
  });

  it("still runs an unlisted or hidden command by name", async () => {
    for (const name of ["cycles", "plumbing"]) {
      const result = await runCommandForTest(config({ unlisted }), [name, "--json"]);
      expect(result.exitCode).toBe(0);
      expect(JSON.parse(result.stdout)).toEqual({ ok: true, data: { ran: name } });
    }
  });

  it("answers `list` with the same list as the binary alone", async () => {
    const alone = await runCommandForTest(config({ unlisted }), []);
    const list = await runCommandForTest(config({ unlisted }), ["list"]);
    expect(list.exitCode).toBe(0);
    expect(list.stdout).toBe(alone.stdout);
  });

  it("shows every command with `list --all`, hidden and unlisted ones included, and no hint", async () => {
    const result = await runCommandForTest(config({ unlisted }), ["list", "--all"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toMatch(/ Repository\n\s+cycles\s+Run cycles/);
    expect(result.stdout).toMatch(/plumbing\s+Run plumbing/);
    expect(result.stdout).not.toContain("list --all");
    const json = await runCommandForTest(config({ unlisted }), ["list", "--all", "--json"]);
    expect(listed(json.stdout)).toEqual(
      ["about", "cycles", "db:migrate", "make:model", "plumbing", "serve", "zebra"].toSorted(),
    );
  });

  it("keeps each command's real `hidden` value in the `list --all --json` data", async () => {
    const json = await runCommandForTest(config({ unlisted }), ["list", "--all", "--json"]);
    const rows = (JSON.parse(json.stdout) as { data: { name: string; hidden: boolean }[] }).data;
    const hidden = Object.fromEntries(rows.map((row) => [row.name, row.hidden]));
    expect(hidden).toEqual({
      about: false,
      cycles: false,
      "db:migrate": false,
      "make:model": false,
      plumbing: true,
      serve: false,
      zebra: false,
    });
  });

  it("refuses an argument or another option after `list` with exit 2", async () => {
    for (const argv of [
      ["list", "db"],
      ["list", "--every"],
    ]) {
      const result = await runCommandForTest(config(), argv);
      expect(result.exitCode).toBe(2);
    }
  });

  it("runs a registered `list` command instead of the built-in", async () => {
    const result = await runCommandForTest({ ...config(), commands: [...COMMANDS, make("list")] }, [
      "list",
      "--json",
    ]);
    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual({ ok: true, data: { ran: "list" } });
  });

  it("completes neither unlisted nor hidden commands, and completes `list --all`", async () => {
    const tab = new TabCompletionsDriver();
    const complete = async (words: string[]) =>
      (
        await runCommandForTest(config({ unlisted }), ["complete", "--", ...words], {
          completions: tab,
        })
      ).stdout
        .split("\n")
        .filter((line) => line !== "" && !line.startsWith(":"))
        .map((line) => line.split("\t")[0]);
    const names = await complete([""]);
    expect(names).toEqual(expect.arrayContaining(["about", "serve", "list"]));
    expect(names).not.toContain("cycles");
    expect(names).not.toContain("plumbing");
    // `--ansi` is a global option every command takes.
    expect((await complete(["list", "--a"])).toSorted()).toEqual(["--all", "--ansi"]);
  });
});
