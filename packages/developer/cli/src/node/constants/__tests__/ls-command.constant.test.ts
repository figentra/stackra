/**
 * Stackra file contract:
 * Purpose: unit tests of `LS_COMMAND`: section counts without a section, one identity per line with one, every
 *          member's manifest prefixed by package at the workspace root, and the refusals.
 * Boundary: test only; writes throwaway manifests in the OS temp directory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 20).
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { LS_COMMAND } from "#node/constants/ls-command.constant";
import { CliUsageError } from "#node/errors/cli-usage.error";
import { captureIo } from "#node/functions/capture-io.function";

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-cli-"));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

const manifest = (folder: string, name: string) => {
  mkdirSync(folder, { recursive: true });
  writeFileSync(join(folder, "package.json"), "{}");
  writeFileSync(
    join(folder, "stackra.manifest.json"),
    JSON.stringify({
      member: "commerce",
      package: name,
      version: "1",
      actions: [
        { key: "orders.order.cancel@1", kind: "action" },
        { key: "orders.order.list@1", kind: "query" },
      ],
      events: [{ name: "orders.order.paid.v1" }],
    }),
  );
};

const ls = async (positionals: string[]) => {
  const { io, output } = captureIo();
  const code = await LS_COMMAND.run({
    cwd: root,
    io,
    values: {},
    positionals,
    rest: [],
    cli: async () => 0,
  });
  return { code, output: output() };
};

describe("LS_COMMAND", () => {
  it("counts each section without a section", async () => {
    manifest(root, "@acme/service-commerce");
    const { code, output } = await ls([]);
    expect(code).toBe(0);
    expect(output).toBe(
      "modules  0\nactions  2\nevents  1\npermissions  0\nerrors  0\nmodels  0\ndrivers  0\n",
    );
  });

  it("lists one identity per line for a section", async () => {
    manifest(root, "@acme/service-commerce");
    expect(await ls(["actions"])).toEqual({
      code: 0,
      output: "orders.order.cancel@1\norders.order.list@1\n",
    });
    expect((await ls(["events"])).output).toBe("orders.order.paid.v1\n");
  });

  it("reads every member's manifest at the workspace root, prefixed by package", async () => {
    writeFileSync(join(root, "pnpm-workspace.yaml"), "packages:\n  - services/*\n");
    manifest(join(root, "services", "commerce"), "@acme/service-commerce");
    expect((await ls(["events"])).output).toBe("@acme/service-commerce  orders.order.paid.v1\n");
  });

  it("fails without a manifest and refuses an unknown section or extra argument", async () => {
    expect((await ls([])).code).toBe(1);
    await expect(ls(["routes"])).rejects.toThrow(CliUsageError);
    await expect(ls(["actions", "events"])).rejects.toThrow(CliUsageError);
  });
});
