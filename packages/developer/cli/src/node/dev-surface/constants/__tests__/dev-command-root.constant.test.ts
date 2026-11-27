/**
 * Stackra file contract:
 * Purpose: unit tests of `DEV_COMMAND`'s root mode: at a product root with a service member, `stackra dev` runs the
 *          whole product (`runDevRoot`) with `--seed` passed on, instead of fanning `encore run` out per service; a root
 *          without service members keeps the member tool; `--seed` anywhere else is a usage error.
 * Boundary: test only; `devReady`, `runDevRoot` and the member tool are replaced, so no process starts.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0296 (decision 3); STA-2840.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { captureIo } from "#node/functions/capture-io.function";
import { runCli } from "#node/functions/run-cli.function";

const calls = vi.hoisted(() => ({ root: [] as unknown[], member: [] as unknown[] }));

vi.mock("#node/doctor/functions/dev-ready.function", () => ({ devReady: async () => true }));
vi.mock("#node/dev-root/functions/run-dev-root.function", () => ({
  runDevRoot: async (context: { values: unknown }) => {
    calls.root.push(context.values);
    return 0;
  },
}));
vi.mock("#node/functions/tool-command.function", () => ({
  toolCommand: (name: string, summary: string) => ({
    name,
    summary,
    usage: `stackra ${name}`,
    options: {},
    run: async (context: { cwd: string }) => {
      calls.member.push(context.cwd);
      return 0;
    },
  }),
}));

let root: string;

beforeEach(() => {
  calls.root.length = 0;
  calls.member.length = 0;
  root = mkdtempSync(join(tmpdir(), "stackra-cli-dev-root-"));
  writeFileSync(join(root, "pnpm-workspace.yaml"), "packages: ['services/*']\n");
  writeFileSync(join(root, "runway.yaml"), "version: 3\nproject: acme\nenvironments:\n  dev: {}\n");
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe("DEV_COMMAND at a product root", () => {
  it("runs every service member as one product, passing --seed on", async () => {
    mkdirSync(join(root, "services", "billing"), { recursive: true });
    writeFileSync(join(root, "services", "billing", "stackra.config.ts"), "export default {};\n");
    const { io } = captureIo();
    expect(await runCli(["dev", "--seed", "minimal"], io, { cwd: root })).toBe(0);
    expect(calls.root).toEqual([expect.objectContaining({ seed: "minimal" })]);
    expect(calls.member).toEqual([]);
  });

  it("keeps the member tool at a root without service members", async () => {
    const { io } = captureIo();
    expect(await runCli(["dev"], io, { cwd: root })).toBe(0);
    expect(calls.root).toEqual([]);
    expect(calls.member).toEqual([root]);
  });

  it("refuses --seed where there is no product with service members", async () => {
    const { io, output } = captureIo();
    expect(await runCli(["dev", "--seed", "demo"], io, { cwd: root })).toBe(2);
    expect(output()).toContain("--seed runs at the root of a product with service members");
  });
});
