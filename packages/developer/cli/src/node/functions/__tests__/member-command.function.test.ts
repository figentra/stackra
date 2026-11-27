/**
 * Stackra file contract:
 * Purpose: unit tests of `memberCommand`: the command runs in its member's console entry with every token as typed
 *          (the first lone `--` dropped), under the member's heading with its aliases; with several members it runs
 *          in the one the working directory sits in, asks on a terminal, and exits 2 naming the members and
 *          `stackra console` without one; a member without a console entry exits 2 and says so.
 * Boundary: test only; each member is a throwaway folder whose console entry is a TypeScript module loaded by Vite.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0506 (decision 6); STA-2888.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { readCommand } from "@stackra/console";
import { runCommandForTest } from "@stackra/console/testing";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { memberCommand } from "#node/functions/member-command.function";
import type { MemberCommandHost } from "#node/types/member-command-host.type";

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-member-command-"));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
  delete (globalThis as { memberRuns?: unknown }).memberRuns;
  delete (globalThis as { memberFolders?: unknown }).memberFolders;
});

/** A member folder; with `code`, a console entry that records its argv under the member's name and returns `code`. */
function member(name: string, code?: number): MemberCommandHost {
  const folder = join(root, "services", name);
  mkdirSync(join(folder, ".stackra", "entry"), { recursive: true });
  if (code !== undefined)
    writeFileSync(
      join(folder, ".stackra", "entry", "console.ts"),
      [
        // Where the entry was imported, as a generated entry reads option defaults when it builds its console.
        "const importedIn = process.cwd();",
        "export const run = async (argv: readonly string[]): Promise<number> => {",
        "  const runs = ((globalThis as { memberRuns?: Record<string, unknown> }).memberRuns ??= {});",
        `  runs[${JSON.stringify(name)}] = [...argv];`,
        "  const folders = ((globalThis as { memberFolders?: Record<string, unknown> }).memberFolders ??= {});",
        `  folders[${JSON.stringify(name)}] = [importedIn, process.cwd()];`,
        `  return ${code};`,
        "};",
        "",
      ].join("\n"),
    );
  return { root: folder, label: `services/${name}` };
}

const runs = () => (globalThis as { memberRuns?: Record<string, unknown> }).memberRuns ?? {};
const folders = () =>
  (globalThis as { memberFolders?: Record<string, unknown> }).memberFolders ?? {};

describe("memberCommand", () => {
  // @covers sta-2888:FR-001
  it("runs the member's command with every token as typed, no -- needed, and returns its exit code", async () => {
    const orders = member("orders", 7);
    const type = memberCommand({ name: "db:status", aliases: [], hidden: false, hosts: [orders] });
    const result = await runCommandForTest(
      [type],
      ["db:status", "--json", "--tenant", "acme", "x"],
      {
        cwd: root,
      },
    );
    expect(result.exitCode).toBe(7);
    expect(runs()).toEqual({ orders: ["db:status", "--json", "--tenant", "acme", "x"] });
  });

  // @covers sta-2888:FR-001
  it("drops the first lone -- as stackra console does, so the old habit and the member's own help still work", async () => {
    const orders = member("orders", 0);
    const type = memberCommand({ name: "db:status", aliases: [], hidden: false, hosts: [orders] });
    await runCommandForTest([type], ["db:status", "-v", "--", "--help", "--", "raw"], {
      cwd: root,
    });
    expect(runs()).toEqual({ orders: ["db:status", "-v", "--help", "--", "raw"] });
  });

  it("runs by an alias under the command's own name", async () => {
    const orders = member("orders", 0);
    const type = memberCommand({
      name: "orders:sync",
      aliases: ["sync"],
      hidden: false,
      hosts: [orders],
    });
    await runCommandForTest([type], ["sync", "--dry-run"], { cwd: root });
    expect(runs()).toEqual({ orders: ["orders:sync", "--dry-run"] });
  });

  // @covers sta-2888:FR-005
  it("sits under its member's heading, says where it comes from and how to see its own options", () => {
    const orders = { ...member("orders"), from: "@stackra/database" };
    const billing = member("billing");
    const one = readCommand(
      memberCommand({ name: "db:status", aliases: ["dbs"], hidden: true, hosts: [orders] }),
    );
    expect(one).toMatchObject({
      name: "db:status",
      aliases: ["dbs"],
      hidden: true,
      group: "services/orders",
      description: "Member command (services/orders, from @stackra/database)",
      passthrough: true,
    });
    expect(one.examples).toContain("stackra db:status -- --help   (its own arguments and options)");
    const shared = readCommand(
      memberCommand({ name: "db:status", aliases: [], hidden: false, hosts: [billing, orders] }),
    );
    expect(shared.group).toBe("services/billing, services/orders");
    expect(shared.description).toContain("services/billing, services/orders");
  });

  // @covers sta-2888:FR-002
  it("runs in the member the working directory sits in when several declare it", async () => {
    const orders = member("orders", 3);
    const billing = member("billing", 4);
    const type = memberCommand({
      name: "db:status",
      aliases: [],
      hidden: false,
      hosts: [billing, orders],
    });
    mkdirSync(join(orders.root, "src"));
    const result = await runCommandForTest([type], ["db:status"], {
      cwd: join(orders.root, "src"),
    });
    expect(result.exitCode).toBe(3);
    expect(runs()).toEqual({ orders: ["db:status"] });
  });

  // @covers sta-2888:FR-003
  it("asks which member on a terminal when several declare it and the person stands in none", async () => {
    const orders = member("orders", 3);
    const billing = member("billing", 4);
    const type = memberCommand({
      name: "db:status",
      aliases: [],
      hidden: false,
      hosts: [billing, orders],
    });
    const result = await runCommandForTest([type], ["db:status", "--json"], {
      cwd: root,
      answers: ["services/orders"],
    });
    expect(result.asked).toEqual(["Which member runs db:status?"]);
    expect(result.exitCode).toBe(3);
    expect(runs()).toEqual({ orders: ["db:status", "--json"] });
  });

  // @covers sta-2888:FR-003
  it("exits 2 without a terminal, naming the members and the command that picks one", async () => {
    const orders = member("orders", 3);
    const billing = member("billing", 4);
    const type = memberCommand({
      name: "db:status",
      aliases: [],
      hidden: false,
      hosts: [billing, orders],
    });
    const result = await runCommandForTest([type], ["db:status"], { cwd: root });
    expect(result.exitCode).toBe(2);
    // The error box wraps at the terminal width: read it as one line of words.
    const text = (result.stdout + result.stderr)
      .replaceAll(/[│╭╮╰╯─]/gu, " ")
      .replaceAll(/\s+/gu, " ");
    expect(text).toContain(
      '"db:status" is a command of more than one member: services/billing, services/orders',
    );
    expect(text).toContain("stackra console services/billing db:status");
    expect(runs()).toEqual({});
  });

  // @covers sta-2888:FR-007
  it("runs in the member's folder from outside it, in the folder the person stands in inside it, then puts the process back", async () => {
    const orders = member("orders", 0);
    mkdirSync(join(orders.root, "src"));
    const type = memberCommand({ name: "db:status", aliases: [], hidden: false, hosts: [orders] });
    const before = process.cwd();
    await runCommandForTest([type], ["db:status"], { cwd: root });
    expect(folders()).toEqual({ orders: [orders.root, orders.root] });
    await runCommandForTest([type], ["db:status"], { cwd: join(orders.root, "src") });
    expect(folders()).toEqual({ orders: [join(orders.root, "src"), join(orders.root, "src")] });
    expect(process.cwd()).toBe(before);
  });

  it("exits 2 and says so when the member has no console entry", async () => {
    const health = member("health");
    const type = memberCommand({
      name: "health:ping",
      aliases: [],
      hidden: false,
      hosts: [health],
    });
    const result = await runCommandForTest([type], ["health:ping"], { cwd: root });
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toContain("services/health has no console entry");
  });
});
