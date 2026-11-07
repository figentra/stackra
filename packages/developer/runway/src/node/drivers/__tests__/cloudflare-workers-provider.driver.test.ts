/**
 * Stackra file contract:
 * Purpose: unit tests of `CloudflareWorkersProviderDriver`: the plan builds, migrates, uploads a version with its secrets and deploys it per
 *          member of the target's kind; apply refuses another checkout and unset values before anything ships, swaps
 *          the placeholder ids for the deploy and restores them (also on failure), sends secrets in a private file only and
 *          records each version; a secret can read another variable; current agrees only when every member serves one
 *          commit; verify retries the smoke checks (with a bearer); rollback uses the recorded versions; invalid
 *          settings name their runway.yaml path.
 * Boundary: test only; the command runner, environment and fetch are fakes, and the member is a temporary folder.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0352 (decisions 1 and 3); ADR 0173; STA-1921.
 */
import { existsSync, mkdirSync, mkdtempSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "@stackra/testing";

import { RunwayDeployFailedError } from "#core/errors/runway-deploy-failed.error";
import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import type { DeployTarget } from "#core/types/deploy-target.type";
import { CloudflareWorkersProviderDriver } from "#node/drivers/cloudflare-workers-provider.driver";
import type { CommandRunner } from "#node/types/command-runner.type";
import type { DeployRunways } from "#node/types/deploy-runways.type";

const SHA = "a".repeat(40);
const OLD = "b".repeat(40);
const BEFORE = "99999999-2222-3333-4444-555555555555";
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
        smoke: [{ url: "https://npm.stackra.figentra.com/-/ping" }],
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

/** Every secrets file a fake run was handed, to prove each is private and gone afterwards. */
const secretFiles: { path: string; mode: number }[] = [];

/** A runner that records each command (with its secrets file's content) and answers by the wrangler subcommand. */
function fakeRunner(
  root: string,
  answers: { head?: string; list?: string; deploy?: string } = {},
): { run: CommandRunner; calls: string[]; configs: string[] } {
  const calls: string[] = [];
  const configs: string[] = [];
  const run: CommandRunner = async (command, args, options) => {
    const where = (options.cwd ?? ".").replace(root, "<root>");
    const at = args.indexOf("--secrets-file");
    const file = at === -1 ? undefined : args[at + 1];
    const shown = file === undefined ? args : args.map((arg, index) => (index === at + 1 ? "<secrets-file>" : arg));
    if (file !== undefined) secretFiles.push({ path: file, mode: statSync(file).mode & 0o777 });
    calls.push(
      `${where}$ ${[command, ...shown].join(" ")}${file === undefined ? "" : ` <<< ${readFileSync(file, "utf8")}`}`,
    );
    if (command === "git") return `${answers.head ?? SHA}\n`;
    const sub = args[2] === "versions" ? `versions ${args[3]}` : args[2];
    if (sub === "versions upload") {
      configs.push(readFileSync(join(options.cwd ?? "", "wrangler.jsonc"), "utf8"));
      if (answers.deploy === "throw") throw new Error("deploy failed");
      return `Uploaded\nWorker Version ID: ${VERSION}\n`;
    }
    if (sub === "deploy") return `Deployed\nCurrent Version ID: ${VERSION}\n`;
    if (sub === "deployments" && args[3] === "status")
      return JSON.stringify({ versions: [{ version_id: BEFORE, percentage: 100 }] });
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
    smokeAttempts: 3,
    smokeIntervalMs: 0,
  });
}

describe("CloudflareWorkersProviderDriver", () => {
  it("plans each member of the target's kind: build, migrations, upload, deploy", () => {
    const driver = workers(".", fakeRunner(".").run);
    expect(
      driver
        .plan(WEB, SHA)
        .map((step) => `${step.cwd ?? "."}$ ${[step.command, ...step.args].join(" ")}`),
    ).toEqual([
      ".$ pnpm turbo run build --filter=./workers/registry",
      "workers/registry$ pnpm exec wrangler d1 migrations apply stackra-registry --remote",
      `workers/registry$ pnpm exec wrangler versions upload --message ${SHA} --var REGISTRY_READ_ONLY:$REGISTRY_READ_ONLY --secrets-file <secrets-file>`,
      `workers/registry$ pnpm exec wrangler versions deploy $VERSION@100 --message ${SHA} --yes`,
      ".$ pnpm turbo run build --filter=./workers/static",
      `workers/static$ pnpm exec wrangler versions upload --message ${SHA}`,
      `workers/static$ pnpm exec wrangler versions deploy $VERSION@100 --message ${SHA} --yes`,
    ]);
  });

  it("plans a member with Durable Object migrations through wrangler deploy", () => {
    const root = repository();
    writeFileSync(
      join(root, "workers/registry/wrangler.jsonc"),
      `{ "name": "x", // a Durable Object
  "migrations": [{ "tag": "v1" },], }`,
    );
    const steps = workers(root, fakeRunner(root).run)
      .plan(WEB, SHA)
      .filter((step) => step.cwd?.endsWith("workers/registry"))
      .map((step) => step.args.join(" "));
    expect(steps.at(-1)).toBe(
      `exec wrangler deploy --message ${SHA} --var REGISTRY_READ_ONLY:$REGISTRY_READ_ONLY --secrets-file <secrets-file>`,
    );
    expect(steps.some((step) => step.includes("versions"))).toBe(false);
  });

  it("applies with the real ids, sends secrets in a private file, restores the config and records versions", async () => {
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
      `<root>/workers/registry$ pnpm exec wrangler versions upload --message ${SHA} --var REGISTRY_READ_ONLY: --secrets-file <secrets-file> <<< {"REGISTRY_SIGNING_KEY":"signing-key-value"}`,
    );
    expect(calls).toContain(
      `<root>/workers/registry$ pnpm exec wrangler versions deploy ${VERSION}@100 --message ${SHA} --yes`,
    );
    expect(calls.filter((call) => call.includes("signing-key-value"))).toHaveLength(1);
    // The secrets file was readable only by its owner and is removed once the upload returns.
    expect(secretFiles.length).toBeGreaterThan(0);
    for (const { path, mode } of secretFiles) {
      expect(mode).toBe(0o600);
      expect(existsSync(path)).toBe(false);
    }
  });

  it("smoke-tests the version at 0% by override and moves no traffic when it fails", async () => {
    const root = repository();
    const { run, calls } = fakeRunner(root);
    const urls: string[] = [];
    const driver = workers(root, run);
    driver.fetch = async (url, headers) => {
      urls.push(`${url} ${headers?.["Cloudflare-Workers-Version-Overrides"]}`);
      return { ok: false, status: 503 };
    };
    await expect(driver.apply(WEB, SHA)).rejects.toThrow(/0% smoke/);
    // The check is retried, three attempts in the test.
    expect(urls).toEqual(
      Array.from(
        { length: 3 },
        () => `https://npm.stackra.figentra.com/-/ping stackra-registry="${VERSION}"`,
      ),
    );
    expect(calls.some((call) => call.includes("versions deploy"))).toBe(false);
  });

  it("rolls a production api Worker out in steps, and all at once with a migration or off production", async () => {
    const root = repository();
    const gradual = {
      ...WEB,
      settings: { members: { registry: { path: "workers/registry", preset: "api" } } },
    };
    const holds: number[] = [];
    const first = fakeRunner(root);
    const driver = workers(root, first.run);
    driver.sleep = async (ms) => void holds.push(ms);
    await driver.apply(gradual, SHA);
    const deploys = first.calls.filter((call) => call.includes("versions deploy"));
    expect(deploys.map((call) => call.split("deploy ")[1]?.split(" --")[0])).toEqual([
      `${VERSION}@10 ${BEFORE}@90`,
      `${VERSION}@50 ${BEFORE}@50`,
      `${VERSION}@100`,
    ]);
    expect(holds).toHaveLength(2);

    const staging = fakeRunner(root);
    await workers(root, staging.run).apply({ ...gradual, environment: "staging" }, SHA);
    expect(staging.calls.filter((call) => call.includes("versions deploy"))).toHaveLength(1);

    writeFileSync(
      join(root, "workers/registry/wrangler.jsonc"),
      `{ "name": "x", // a Durable Object
  "migrations": [{ "tag": "v1" },], }`,
    );
    const migrating = fakeRunner(root);
    await workers(root, migrating.run).apply(gradual, SHA);
    expect(migrating.calls.some((call) => call.includes("versions"))).toBe(false);
    expect(migrating.calls.some((call) => call.includes("wrangler deploy"))).toBe(true);
  });

  it("puts the previous version back when a rollout step fails its smoke", async () => {
    const root = repository();
    const gradual = {
      ...WEB,
      settings: {
        members: {
          registry: {
            path: "workers/registry",
            preset: "api",
            smoke: [{ url: "https://x.test/ping" }],
          },
        },
      },
    };
    const { run, calls } = fakeRunner(root);
    let seen = 0;
    const driver = workers(root, run);
    driver.sleep = async () => {};
    driver.fetch = async () => ({ ok: ++seen < 3, status: seen < 3 ? 200 : 503 }); // 0%, step 1 pass; step 2 fails
    const failure = driver.apply(gradual, SHA);
    await expect(failure).rejects.toThrow(RunwayDeployFailedError);
    await expect(failure).rejects.toMatchObject({
      results: [{ record: { reference: `registry=${BEFORE}` } }],
    });
    expect(calls.at(-1)).toContain(`wrangler rollback ${BEFORE} --message ${SHA}`);
    expect(calls.filter((call) => call.includes("versions deploy"))).toHaveLength(2);

    // A failing first move changes nothing, so nothing is reverted.
    const first = fakeRunner(root);
    const stuck = workers(root, async (command, args, options) => {
      if (args.includes("deploy") && args.includes("versions")) throw new Error("move failed");
      return first.run(command, args, options);
    });
    await expect(stuck.apply(gradual, SHA)).rejects.toThrow("move failed");
    expect(first.calls.some((call) => call.includes("rollback"))).toBe(false);
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

  it("maps a secret to another variable and retries a bearer smoke check until it answers", async () => {
    const root = repository();
    mkdirSync(join(root, "workers/turbo-cache"), { recursive: true });
    writeFileSync(
      join(root, "workers/turbo-cache/wrangler.jsonc"),
      `{ "name": "stackra-turbo-cache" }`,
    );
    const cache = "https://turbo.stackra.figentra.com/v8/artifacts/status";
    const target: DeployTarget = {
      ...WEB,
      settings: {
        members: {
          "turbo-cache": {
            path: "workers/turbo-cache",
            secrets: { TURBO_CACHE_TOKEN: "TURBO_TOKEN" },
            smoke: [{ url: cache, bearer: "TURBO_TOKEN" }],
          },
        },
      },
    };
    const { run, calls } = fakeRunner(root);
    // The 0% smoke retries once, then each verify reads one 2xx; later answers are 503.
    const statuses = [503, 200, 200];
    const seen: string[] = [];
    const driver = Object.assign(workers(root, run, { env: { TURBO_TOKEN: "cache-token" } }), {
      fetch: async (url: string, headers: Readonly<Record<string, string>>) => {
        seen.push(`${url} ${headers["authorization"] ?? ""}`);
        const status = statuses.shift() ?? 503;
        return { ok: status < 300, status };
      },
    });

    const record = await driver.apply(target, SHA);
    expect(calls).toContain(
      `<root>/workers/turbo-cache$ pnpm exec wrangler versions upload --message ${SHA} --secrets-file <secrets-file> <<< {"TURBO_CACHE_TOKEN":"cache-token"}`,
    );
    expect(await driver.verify(target, record)).toEqual({ status: "up" });
    expect(seen).toEqual(Array.from({ length: 3 }, () => `${cache} Bearer cache-token`));
    expect((await driver.verify(target, record)).detail).toBe(
      `turbo-cache smoke ${cache} answered 503 after 3 attempts`,
    );
    await expect(workers(root, run, { env: {} }).apply(target, SHA)).rejects.toMatchObject({
      issues: [
        { path: "targets.cloudflare-workers.members.turbo-cache.secrets" },
        { path: "targets.cloudflare-workers.members.turbo-cache.smoke" },
      ],
    });
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
    expect(driver.plan(WEB, SHA)).toHaveLength(3);
    expect(() =>
      driver.plan({ ...WEB, settings: { members: { static: { path: "../outside" } } } }, SHA),
    ).toThrow(/targets\.cloudflare-workers\.members\.static\.path/);
    expect(() => driver.plan({ ...WEB, kind: "mobile" }, SHA)).toThrow(RunwayUnresolvedError);
  });

  describe("with runways (secrets read from Infisical)", () => {
    const RUNWAYS: DeployRunways = {
      root: {
        environments: { production: {} },
        providers: {
          github: { org: "acme", repo: "platform" },
          infisical: {
            workspace: "ws-1",
            environments: { production: "prod" },
            paths: { runtime: "/runtime" },
          },
        },
        secrets: { defaultPath: "runtime" },
      },
      members: [
        { member: "registry", folder: "workers", runway: { secrets: ["REGISTRY_SIGNING_KEY"] } },
      ],
    };

    it("sends the Infisical value in the secrets file, not the environment's", async () => {
      const root = repository();
      const { run, calls } = fakeRunner(root);
      const answering: CommandRunner = async (command, args, options) =>
        command === "infisical"
          ? JSON.stringify([{ key: "REGISTRY_SIGNING_KEY", value: "infisical-value" }])
          : run(command, args, options);
      const driver = workers(root, answering, {
        env: { REGISTRY_D1_DATABASE_ID: REAL_D1, REGISTRY_READ_ONLY: "" },
      });
      driver.runways = RUNWAYS;
      driver.ci = true;
      await driver.apply(WEB, SHA);
      expect(calls).toContain(
        `<root>/workers/registry$ pnpm exec wrangler versions upload --message ${SHA} --var REGISTRY_READ_ONLY: --secrets-file <secrets-file> <<< {"REGISTRY_SIGNING_KEY":"infisical-value"}`,
      );
    });

    it("ships nothing when Infisical lacks a secret", async () => {
      const root = repository();
      const { run, calls } = fakeRunner(root);
      const answering: CommandRunner = async (command, args, options) =>
        command === "infisical" ? "[]" : run(command, args, options);
      const driver = workers(root, answering);
      driver.runways = RUNWAYS;
      driver.ci = true;
      await expect(driver.apply(WEB, SHA)).rejects.toThrow("REGISTRY_SIGNING_KEY");
      expect(calls.some((call) => /wrangler (deploy|versions)/.test(call))).toBe(false);
    });
  });
});

const target = (settings: Record<string, unknown>): DeployTarget => ({
  ...WEB,
  settings: {
    ...WEB.settings,
    members: { static: { path: "workers/static", ...settings } },
  },
});

describe("CloudflareWorkersProviderDriver drift", () => {
  const ACCOUNT = "d861f9ac9df28b7f0b1298cc0c89bc9d";
  // The worker base turns logs on (ADR 0519), so a matching Worker reports them on.
  const OBSERVED = { enabled: true, logs: { enabled: true, invocation_logs: true } };
  const drifting = (root: string, live: Record<string, Record<string, unknown>>) => {
    const reads: string[] = [];
    const provider = workers(root, fakeRunner(root).run, {
      env: { CLOUDFLARE_API_TOKEN_READ: "read", CLOUDFLARE_ACCOUNT_ID: ACCOUNT },
    });
    provider.read = async (path, token) => {
      reads.push(`${path} ${token}`);
      return live[path.endsWith("/subdomain") ? "subdomain" : "settings"] ?? {};
    };
    return { provider, reads };
  };
  it("is empty when Cloudflare reports what runway.yaml renders", async () => {
    const { provider, reads } = drifting(repository(), {
      settings: { compatibility_date: "2026-10-01", observability: OBSERVED },
      subdomain: { enabled: false, previews_enabled: false },
    });
    const [result] = await provider.drift(
      target({ compatibilityDate: "2026-10-01", workersDev: false }),
    );
    expect(result?.rows).toEqual([]);
    expect(reads.every((read) => read.endsWith(" read"))).toBe(true);
  });

  it("lists each differing setting, and an unset one", async () => {
    const { provider } = drifting(repository(), {
      settings: { compatibility_date: "2026-01-01", observability: OBSERVED },
      subdomain: { enabled: true },
    });
    const [result] = await provider.drift(
      target({ compatibilityDate: "2026-10-01", workersDev: false }),
    );
    expect(result?.worker).toBe("stackra-static");
    expect(result?.rows).toEqual([
      { key: "compatibility_date", rendered: '"2026-10-01"', live: '"2026-01-01"' },
      { key: "workers_dev", rendered: "false", live: "true" },
    ]);
  });

  it("refuses without the read token, and never calls anything but a read", async () => {
    const root = repository();
    const provider = workers(root, fakeRunner(root).run, { env: {} });
    await expect(provider.drift(target({}))).rejects.toBeInstanceOf(RunwayUnresolvedError);
  });
});
