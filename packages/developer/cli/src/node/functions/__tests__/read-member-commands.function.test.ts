/**
 * Stackra file contract:
 * Purpose: unit tests of `readMemberCommands`: one row per command name with every member that declares it, the
 *          `stackra` names and a package's own binary commands left out, aliases kept only while free, hidden only when
 *          every member hides it, a broken manifest skipped, and a single member read outside a workspace.
 * Boundary: test only; the workspace is a throwaway folder of package.json and stackra.manifest.json files.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0506 (decision 6); STA-2888.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { readMemberCommands } from "#node/functions/read-member-commands.function";

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-member-commands-"));
  writeFileSync(join(root, "pnpm-workspace.yaml"), "packages:\n  - services/*\n");
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

/** A manifest `commands` row with the defaults gen writes. */
const row = (name: string, extra: Record<string, unknown> = {}) => ({
  name,
  aliases: [],
  hidden: false,
  audit: false,
  bin: false,
  class: "Probe",
  file: "src/probe.command.ts",
  entry: "core",
  ...extra,
});

/** A member (a service unless `layout` names another call) whose manifest holds `manifest` (a string as it is). */
function service(name: string, manifest?: unknown, layout = "defineService"): string {
  const folder = join(root, "services", name);
  mkdirSync(folder, { recursive: true });
  writeFileSync(join(folder, "package.json"), JSON.stringify({ name: `@acme/service-${name}` }));
  writeFileSync(join(folder, "stackra.config.ts"), `export default ${layout}({});\n`);
  if (manifest !== undefined)
    writeFileSync(
      join(folder, "stackra.manifest.json"),
      typeof manifest === "string" ? manifest : JSON.stringify(manifest),
    );
  return folder;
}

describe("readMemberCommands", () => {
  // @covers sta-2888:FR-001
  it("gives one row per name with every member that declares it, sorted", () => {
    const orders = service("orders", {
      commands: [row("orders:sync"), row("db:status", { from: "@stackra/database" })],
    });
    const billing = service("billing", { commands: [row("db:status")] });
    service("health");
    expect(readMemberCommands(root, new Set())).toEqual([
      {
        name: "db:status",
        aliases: [],
        hidden: false,
        hosts: [
          { root: billing, label: "services/billing" },
          { root: orders, label: "services/orders", from: "@stackra/database" },
        ],
      },
      {
        name: "orders:sync",
        aliases: [],
        hidden: false,
        hosts: [{ root: orders, label: "services/orders" }],
      },
    ]);
  });

  it("reads the workspace around a folder inside it", () => {
    const orders = service("orders", { commands: [row("orders:sync")] });
    expect(readMemberCommands(join(orders, "src"), new Set()).map((each) => each.name)).toEqual([
      "orders:sync",
    ]);
  });

  // @covers sta-2888:FR-004
  it("leaves out the stackra names and a package's own binary commands", () => {
    service("orders", {
      commands: [row("gen"), row("db:migrate"), row("tool", { bin: true }), row("orders:sync")],
    });
    expect(
      readMemberCommands(root, new Set(["gen", "db:migrate"])).map((each) => each.name),
    ).toEqual(["orders:sync"]);
  });

  // @covers sta-2888:FR-004
  it("never offers a package, whose commands run in its host, nor a member gen cannot read", () => {
    service("database", { commands: [row("db:status")] }, "definePackage");
    service("odd", { commands: [row("odd:run")] }, "notDefine");
    const web = service("web", { commands: [row("web:warm")] }, "defineApp");
    const edge = service("edge", { commands: [row("edge:purge")] }, "defineWorker");
    expect(
      readMemberCommands(root, new Set()).map((each) => [each.name, each.hosts[0]?.root]),
    ).toEqual([
      ["edge:purge", edge],
      ["web:warm", web],
    ]);
  });

  it("keeps an alias only while no stackra command, member command or other alias takes it", () => {
    service("orders", {
      commands: [
        row("orders:sync", { aliases: ["os", "gen", "sync", "billing:run"] }),
        row("orders:list", { aliases: ["ol"] }),
      ],
    });
    service("billing", { commands: [row("billing:run", { aliases: ["sync", "br"] })] });
    const aliases = Object.fromEntries(
      readMemberCommands(root, new Set(["gen"])).map((each) => [each.name, each.aliases]),
    );
    expect(aliases).toEqual({
      "billing:run": ["br"],
      "orders:list": ["ol"],
      "orders:sync": ["os"],
    });
  });

  it("hides a command only when every member that declares it hides it", () => {
    service("orders", {
      commands: [row("db:status", { hidden: true }), row("orders:secret", { hidden: true })],
    });
    service("billing", { commands: [row("db:status")] });
    const hidden = Object.fromEntries(
      readMemberCommands(root, new Set()).map((each) => [each.name, each.hidden]),
    );
    expect(hidden).toEqual({ "db:status": false, "orders:secret": true });
  });

  it("skips a broken manifest or row and a manifest without commands", () => {
    service("broken", "{ not json");
    service("odd", { commands: "no" });
    service("plain", { name: "@acme/service-plain" });
    service("rows", { commands: [null, 7, { aliases: [] }, row("rows:ok")] });
    expect(readMemberCommands(root, new Set()).map((each) => each.name)).toEqual(["rows:ok"]);
  });

  it("reads the folder alone outside a workspace, and nothing when it has no manifest", () => {
    rmSync(join(root, "pnpm-workspace.yaml"));
    const orders = service("orders", { commands: [row("orders:sync")] });
    expect(readMemberCommands(orders, new Set())).toEqual([
      {
        name: "orders:sync",
        aliases: [],
        hidden: false,
        hosts: [{ root: orders, label: "orders" }],
      },
    ]);
    expect(readMemberCommands(join(root, "nowhere"), new Set())).toEqual([]);
  });
});
