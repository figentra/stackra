/**
 * Stackra file contract:
 * Purpose: unit tests of `runDevRoot`: a product with two service members runs ONE `encore run` on the gateway in the
 *          local monolith app (never one per service) with every member's dev secrets, forwards the member dev port to
 *          the gateway, fans the other members (Workers among them) out with services filtered off, migrates and seeds
 *          once the gateway answers, stops the fan-out and closes the forwards when encore ends and answers the first
 *          non-zero exit code;
 *          a forward that cannot start is named and the run goes on.
 * Boundary: test only; a temporary product with gen's outputs already written (no `stackra.config.ts`, so gen does
 *           not run) and fake tools, so no process starts.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0296 (decision 3); STA-2840.
 */
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { runDevRoot } from "#node/dev-root/functions/run-dev-root.function";
import type { DevRootTools } from "#node/dev-root/types/dev-root-tools.type";
import { captureIo } from "#node/functions/capture-io.function";
import type { CliContext } from "#node/types/cli-context.type";
import type { ToolRun } from "#node/types/tool-run.type";

let root: string;

/** Writes `content` at `path` under the product. */
function write(path: string, content: string): void {
  mkdirSync(join(root, path, ".."), { recursive: true });
  writeFileSync(join(root, path), content);
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-dev-root-run-"));
  write("pnpm-workspace.yaml", "packages: ['services/*', 'workers/*']\n");
  write("runway.yaml", "environments:\n  dev:\n    infra:\n      gateway:\n        port: 4000\n");
  write(".stackra/dev-secrets.json", JSON.stringify({ BILLING_KEY: "b", USAGE_KEY: "u" }));
  for (const [name, secret] of [
    ["billing", "BILLING_KEY"],
    ["usage", "USAGE_KEY"],
  ] as const) {
    write(`services/${name}/package.json`, JSON.stringify({ name: `@acme/${name}`, imports: {} }));
    write(`services/${name}/encore.app`, '{ "id": "acme", "lang": "typescript" }\n');
    write(
      `services/${name}/stackra.manifest.json`,
      JSON.stringify({ env: [{ name: secret, kind: "secret" }] }),
    );
    write(
      `services/${name}/stackra-encore/${name}/database.ts`,
      `export const database = new SQLDatabase("${name}", {});\n`,
    );
    write(`services/${name}/.stackra/migrations/0001.sql`, "select 1;\n");
  }
  write("services/billing/runway.yaml", "version: 3\nenvironments:\n  dev:\n    port: 4019\n");
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

/** Fake tools: `encore run` exits with `encoreExit`; forwards on `refused` ports fail. */
function fakes(encoreExit = 0, refused: number[] = []) {
  const runs: ToolRun[] = [];
  const forwards: number[] = [];
  let closed = 0;
  const tools: DevRootTools = {
    run: async (tool) => {
      runs.push(tool);
      if (tool.command === "encore") return encoreExit;
      // The fan-out runs until the run ends, as a dev server does.
      return new Promise<number>((resolve) => {
        if (tool.command !== "turbo") resolve(0);
        else if (tool.signal?.aborted === true) resolve(143);
        else tool.signal?.addEventListener("abort", () => resolve(143), { once: true });
      });
    },
    capture: async (_command, args) => `postgresql://localhost/${args[2]}`,
    waitFor: async () => true,
    forward: async (port) => {
      if (refused.includes(port))
        throw new Error(`cannot forward port ${port} to the gateway: in use`);
      forwards.push(port);
      return { ports: [port], addresses: ["127.0.0.1"], close: async () => void (closed += 1) };
    },
  };
  return { tools, runs, forwards, closed: () => closed };
}

/** The command context at the product root. */
const context = (values: CliContext["values"] = {}): CliContext => ({
  cwd: root,
  io: captureIo().io,
  values,
  positionals: [],
  rest: [],
  cli: async () => 0,
});

describe("runDevRoot", () => {
  it("runs one encore run of every service, forwards, fans the rest out and prepares the data", async () => {
    const fake = fakes();
    // encore exiting ends the run: the fan-out is stopped (143) and that is the answer.
    expect(await runDevRoot(context({ seed: "none" }), fake.tools)).toBe(143);
    expect(fake.runs.find((run) => run.command === "turbo")?.signal?.aborted).toBe(true);

    const encore = fake.runs.filter((run) => run.command === "encore");
    expect(encore).toHaveLength(1);
    expect(encore[0]).toMatchObject({
      args: ["run", "--port=4000", "--browser=never"],
      cwd: join(root, ".stackra/dev/encore"),
      env: { BILLING_KEY: "b", USAGE_KEY: "u", STACKRA_LANE: "0" },
    });
    expect(JSON.parse(readFileSync(join(root, ".stackra/dev/encore/encore.app"), "utf8")).id).toBe(
      "acme",
    );
    expect(existsSync(join(root, ".stackra/dev/encore/services/usage/stackra-encore"))).toBe(true);
    expect(fake.runs.find((run) => run.command === "turbo")).toMatchObject({
      args: ["run", "dev", "--filter=!./services/*"],
      cwd: root,
    });
    expect(fake.forwards).toEqual([4019]);
    expect(fake.closed()).toBe(1);
    expect(
      fake.runs.filter((run) => run.command === "stackra").map((run) => [run.cwd, ...run.args]),
    ).toEqual([
      [join(root, "services/billing"), "db", "migrate", "--env", "dev"],
      [join(root, "services/usage"), "db", "migrate", "--env", "dev"],
    ]);
  });

  it("answers encore's exit code and goes on when a forward cannot start", async () => {
    const fake = fakes(7, [4019]);
    const { io, output } = captureIo();
    expect(await runDevRoot({ ...context(), io }, fake.tools)).toBe(7);
    expect(fake.forwards).toEqual([]);
    expect(output()).toContain("billing: cannot forward port 4019 to the gateway: in use");
  });
});
