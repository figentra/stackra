/**
 * Stackra file contract:
 * Purpose: unit tests of `CloudflareWorkersProviderDriver`: the plan builds, migrates, deploys and sets secrets per
 *          member of the target's kind; apply refuses another checkout and unset values before anything ships, swaps
 *          the placeholder ids for the deploy and restores them (also on failure), sends secrets on stdin only and
 *          records each version; current agrees only when every member serves one commit; verify adds the smoke
 *          URLs; rollback uses the recorded versions; invalid settings name their runway.yaml path.
 * Boundary: test only; the command runner, environment and fetch are fakes, and the member is a temporary folder.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0352 (decisions 1 and 3); ADR 0173; STA-1921.
 */
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "@stackra/testing";

import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import type { DeployTarget } from "#core/types/deploy-target.type";
import { CloudflareWorkersProviderDriver } from "#node/drivers/cloudflare-workers-provider.driver";
import type { CommandRunner } from "#node/types/command-runner.type";

const SHA = "a".repeat(40);
const OLD = "b".repeat(40);
const VERSION = "11111111-2222-3333-4444-555555555555";
const D1 = "00000000-0000-0000-0000-000000000000";
const REAL_D1 = "abcdefab-1234-5678-9abc-def012345678";

// A comment with a URL, https://x.test/a, and a trailing comma, as a hand-written wrangler.jsonc has.
const CONFIG = `{ "name": "stackra-registry", // note
  "d1_databases": [{ "database_id": "${D1}" },], /* gone */ }`;

const WEB: DeployTarget = {
  id: "production/web",
  environment: "production",
  kind: "web",
  destination: "cloudflare-workers",
  settings: {
    compatibilityDate: "2026-10-01",
    members: {
      registry: {
        path: "workers/registry",
        ids: { REGISTRY_D1_DATABASE_ID: D1 },
        d1: ["stackra-registry"],
        vars: ["REGISTRY_READ_ONLY"],
        secrets: ["REGISTRY_SIGNING_KEY"],
        smoke: "https://npm.stackra.figentra.com/-/ping",
      },
      static: { path: "workers/static" },
      docs: { path: "apps/docs", kind: "docs" },
    },
  },
  scope: {},
};

const ENV = {
  REGISTRY_D1_DATABASE_ID: REAL_D1,
  REGISTRY_READ_ONLY: "",
  REGISTRY_SIGNING_KEY: "signing-key-value",
};

/** `wrangler deployments list --json` with one deployment per message, newest last. */
function deployments(...messages: string[]): string {
  return JSON.stringify(
    messages.map((message, index) => ({
      created_on: `2026-11-01T00:00:0${index}Z`,
      annotations: { "workers/message": message },
    })),
  );
}

/** A repository root holding the registry member's wrangler.jsonc. */
function repository(): string {
  const root = mkdtempSync(join(tmpdir(), "runway-workers-"));
  mkdirSync(join(root, "workers/registry"), { recursive: true });
  mkdirSync(join(root, "workers/static"), { recursive: true });
  writeFileSync(join(root, "workers/registry/wrangler.jsonc"), CONFIG);
  writeFileSync(join(root, "workers/static/wrangler.jsonc"), `{ "name": "stackra-static" }`);
  return root;
}

/** A runner that records each command (with its input) and answers by the wrangler subcommand. */
function fakeRunner(
  root: string,
  answers: { head?: string; list?: string; deploy?: string } = {},
): { run: CommandRunner; calls: string[]; configs: string[] } {
  const calls: string[] = [];
  const configs: string[] = [];
  const run: CommandRunner = async (command, args, options) => {
    const where = (options.cwd ?? ".").replace(root, "<root>");
    calls.push(
      `${where}$ ${[command, ...args].join(" ")}${options.input === undefined ? "" : ` <<< ${options.input}`}`,
    );
    if (command === "git") return `${answers.head ?? SHA}\n`;
    const sub = args[2];
    if (sub === "deploy") {
      configs.push(readFileSync(join(options.cwd ?? "", "wrangler.jsonc"), "utf8"));
      if (answers.deploy === "throw") throw new Error("deploy failed");
      return `Uploaded\nCurrent Version ID: ${VERSION}\n`;
    }
    if (sub === "deployments") return answers.list ?? deployments(SHA);
    return "";
  };
  return { run, calls, configs };
}

/** The provider over `root`, with a fake runner, environment and fetch. */
function workers(
  root: string,
  run: CommandRunner,
  options: { env?: Record<string, string>; status?: number } = {},
): CloudflareWorkersProviderDriver {
  return Object.assign(new CloudflareWorkersProviderDriver(), {
    root,
    run,
    env: options.env ?? ENV,
    fetch: async () => ({ ok: (options.status ?? 200) < 300, status: options.status ?? 200 }),
  });
}

describe("CloudflareWorkersProviderDriver", () => {
  it("plans each member of the target's kind: build, migrations, deploy, secrets", () => {
    const driver = workers(".", fakeRunner(".").run);
    expect(
      driver
        .plan(WEB, SHA)
        .map((step) => `${step.cwd ?? "."}$ ${[step.command, ...step.args].join(" ")}`),
    ).toEqual([
      ".$ pnpm turbo run build --filter=./workers/registry",
      "workers/registry$ pnpm exec wrangler d1 migrations apply stackra-registry --remote",
      `workers/registry$ pnpm exec wrangler deploy --message ${SHA} --var REGISTRY_READ_ONLY:$REGISTRY_READ_ONLY`,
      "workers/registry$ pnpm exec wrangler secret bulk",
      ".$ pnpm turbo run build --filter=./workers/static",
      `workers/static$ pnpm exec wrangler deploy --message ${SHA}`,
    ]);
  });

  it("applies with the real ids, sends secrets on stdin, restores the config and records versions", async () => {
    const root = repository();
    const { run, calls, configs } = fakeRunner(root);
    const record = await workers(root, run).apply(WEB, SHA);

    expect(record).toEqual({
      target: "production/web",
      sha: SHA,
      reference: `registry=${VERSION},static=${VERSION}`,
    });
    expect(configs[0]).toContain(REAL_D1);
    // The operational settings come from runway.yaml: the root's compatibility date and the base.
    expect(JSON.parse(configs[0] ?? "")).toMatchObject({
      name: "stackra-registry",
      compatibility_date: "2026-10-01",
      workers_dev: false,
      upload_source_maps: true,
      observability: { logs: { enabled: true, invocation_logs: true }, issues: { enabled: true } },
    });
    expect(readFileSync(join(root, "workers/registry/wrangler.jsonc"), "utf8")).toBe(CONFIG);
    expect(calls).toContain(
      `<root>/workers/registry$ pnpm exec wrangler secret bulk <<< {"REGISTRY_SIGNING_KEY":"signing-key-value"}`,
    );
    expect(calls.filter((call) => call.includes("signing-key-value"))).toHaveLength(1);
    expect(calls).toContain(
      `<root>/workers/registry$ pnpm exec wrangler deploy --message ${SHA} --var REGISTRY_READ_ONLY:`,
    );
  });

  it("restores the config when the deploy fails", async () => {
    const root = repository();
    const { run } = fakeRunner(root, { deploy: "throw" });
    await expect(workers(root, run).apply(WEB, SHA)).rejects.toThrow("deploy failed");
    expect(readFileSync(join(root, "workers/registry/wrangler.jsonc"), "utf8")).toBe(CONFIG);
  });

  it("refuses another checkout, and an unset secret or bad id before anything ships", async () => {
    const root = repository();
    const other = fakeRunner(root, { head: OLD });
    await expect(workers(root, other.run).apply(WEB, SHA)).rejects.toThrow(RunwayUnresolvedError);

    const unset = fakeRunner(root);
    const driver = workers(root, unset.run, {
      env: { REGISTRY_D1_DATABASE_ID: '"},{"x', REGISTRY_SIGNING_KEY: "" },
    });
    const failure = driver.apply(WEB, SHA);
    await expect(failure).rejects.toThrow(RunwayInvalidError);
    await expect(failure).rejects.toMatchObject({
      issues: [
        { path: "targets.cloudflare-workers.members.registry.ids.REGISTRY_D1_DATABASE_ID" },
        { path: "targets.cloudflare-workers.members.registry.secrets" },
      ],
    });
    expect(unset.calls).toEqual([`.$ git rev-parse HEAD`]);
  });

  it("reads the current commit from every member and verifies with the smoke URL", async () => {
    const root = repository();
    const record = { target: WEB.id, sha: SHA, reference: "" };

    const same = fakeRunner(root, { list: deployments(OLD, SHA, "Secret Change") });
    expect(await workers(root, same.run).current(WEB)).toBe(SHA);
    expect(await workers(root, same.run).verify(WEB, record)).toEqual({ status: "up" });
    expect((await workers(root, same.run, { status: 503 }).verify(WEB, record)).status).toBe(
      "down",
    );

    const never = fakeRunner(root, { list: "[]" });
    expect(await workers(root, never.run).current(WEB)).toBeNull();
    expect((await workers(root, never.run).verify(WEB, record)).status).toBe("down");
  });

  it("rolls each member back to its recorded version, and refuses a record without one", async () => {
    const root = repository();
    const { run, calls } = fakeRunner(root);
    const to = { target: WEB.id, sha: OLD, reference: `registry=${VERSION},static=${VERSION}` };
    expect(await workers(root, run).rollback(WEB, to)).toEqual(to);
    expect(calls).toEqual([
      `<root>/workers/registry$ pnpm exec wrangler rollback ${VERSION} --message ${OLD}`,
      `<root>/workers/static$ pnpm exec wrangler rollback ${VERSION} --message ${OLD}`,
    ]);
    await expect(
      workers(root, run).rollback(WEB, { ...to, reference: `registry=${VERSION}` }),
    ).rejects.toThrow(RunwayUnresolvedError);
  });

  it("ships only the named members, and names the runway.yaml path of a bad setting", () => {
    const driver = Object.assign(workers(".", fakeRunner(".").run), { only: ["static"] });
    expect(driver.plan(WEB, SHA)).toHaveLength(2);
    expect(() =>
      driver.plan({ ...WEB, settings: { members: { static: { path: "../outside" } } } }, SHA),
    ).toThrow(/targets\.cloudflare-workers\.members\.static\.path/);
    expect(() => driver.plan({ ...WEB, kind: "mobile" }, SHA)).toThrow(RunwayUnresolvedError);
  });
});
