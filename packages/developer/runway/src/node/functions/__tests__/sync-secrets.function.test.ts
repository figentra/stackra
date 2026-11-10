/**
 * Stackra file contract:
 * Purpose: unit tests of the secret sync (STA-606): `secretSyncPlan` gives each member its names, sops scope and
 *          writer; `readMemberSecrets` reads only in CI, only from the job's environment, returns only the declared
 *          names and fails on a missing one; `syncSecrets` writes each service secret into Encore with the value on
 *          stdin, reads everything before it writes, and its dry run reads nothing. Canary values prove no value
 *          reaches an argument, a printed line or an error.
 * Boundary: test only; a recording command runner stands in for encore, a plain object for the job's environment, and
 *           a temporary folder for the repository. Nothing reaches a real vault or app.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0525 (sops; CI decrypts in place); ADR 0267; STA-606.
 */
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "@stackra/testing";

import { readMemberSecrets } from "#node/functions/read-member-secrets.function";
import { secretSyncPlan } from "#node/functions/secret-sync-plan.function";
import { syncSecrets } from "#node/functions/sync-secrets.function";
import type { CommandRunner } from "#node/types/command-runner.type";
import type { DeployRunways } from "#node/types/deploy-runways.type";

/** Values no line, argument or error may contain. */
const CANARIES = { STRIPE_SECRET_KEY: "canary-stripe-7f3a", MAIL_TOKEN: "canary-mail-91c2" };

const RUNWAYS: DeployRunways = {
  root: {
    project: "acme",
    environments: { staging: { encore: { environment: "staging-eu" } }, production: {} },
    providers: {
      encore: { app: "acme-x1" },
      github: { org: "acme", repo: "platform" },
    },
    mobile: { field: {} },
  },
  members: [
    {
      member: "api",
      folder: "services",
      runway: {
        secrets: ["STRIPE_SECRET_KEY"],
        environments: { staging: { secrets: ["MAIL_TOKEN"] } },
      },
    },
    { member: "billing", folder: "services", runway: { secrets: ["MAIL_TOKEN"] } },
    { member: "edge", folder: "workers", runway: { secrets: ["EDGE_KEY"] } },
    { member: "field", folder: "apps", runway: { secrets: ["SENTRY_DSN"] } },
    { member: "console", folder: "apps", runway: { secrets: ["ANALYTICS_KEY"] } },
    { member: "docs", folder: "apps", runway: {} },
  ],
};

/** A runner that records every call and the encore.app of an Encore write's working directory. */
function recorder(): {
  readonly run: CommandRunner;
  readonly calls: {
    readonly command: string;
    readonly args: readonly string[];
    readonly input?: string;
    readonly app?: string;
  }[];
} {
  const calls: { command: string; args: readonly string[]; input?: string; app?: string }[] = [];
  const run: CommandRunner = async (command, args, options) => {
    // An Encore write records the encore.app of its working directory, which the sync removes afterwards.
    const app =
      command === "encore" && options.cwd !== undefined
        ? readFileSync(join(options.cwd, "encore.app"), "utf8")
        : undefined;
    calls.push({
      command,
      args,
      ...(options.input === undefined ? {} : { input: options.input }),
      ...(app === undefined ? {} : { app }),
    });
    return "";
  };
  return { run, calls };
}

/** A runner whose every write fails with the value in its message and stderr. */
const failing: CommandRunner = async (_command, _args, options) => {
  throw Object.assign(new Error(`encore failed: ${options.input ?? ""}`), {
    stderr: options.input,
  });
};

/** The message of what `promise` rejects with. */
async function rejection(promise: Promise<unknown>): Promise<string> {
  try {
    await promise;
  } catch (error) {
    return (error as Error).message;
  }
  throw new Error("expected a rejection");
}

/** Fails when `text` holds any canary value. */
function expectNoValue(text: string): void {
  for (const value of Object.values(CANARIES)) expect(text).not.toContain(value);
}

const repositories: string[] = [];

/** A repository folder, with the generated Encore app when `encore`. */
function repository(encore: boolean): string {
  const root = mkdtempSync(join(tmpdir(), "runway-secrets-"));
  repositories.push(root);
  if (encore) mkdirSync(join(root, "stackra-encore"), { recursive: true });
  return root;
}

afterEach(() => {
  for (const root of repositories.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("secretSyncPlan", () => {
  it("gives each member that declares a secret its names, sops scope and writer", () => {
    const scope = "products/acme/staging";
    expect(secretSyncPlan("staging", RUNWAYS)).toEqual([
      {
        member: "api",
        folder: "services/api",
        names: ["MAIL_TOKEN", "STRIPE_SECRET_KEY"],
        scope,
        writer: "encore",
      },
      {
        member: "billing",
        folder: "services/billing",
        names: ["MAIL_TOKEN"],
        scope,
        writer: "encore",
      },
      {
        member: "edge",
        folder: "workers/edge",
        names: ["EDGE_KEY"],
        scope,
        writer: "cloudflare-workers",
      },
      { member: "field", folder: "apps/field", names: ["SENTRY_DSN"], scope, writer: "eas" },
      {
        member: "console",
        folder: "apps/console",
        names: ["ANALYTICS_KEY"],
        scope,
        writer: "none",
      },
    ]);
  });
});

describe("secretSyncPlan gateway", () => {
  const withGateway: DeployRunways = {
    ...RUNWAYS,
    root: { ...RUNWAYS.root, secrets: { gateway: ["GATEWAY_VISITOR_SIGNING_KEY"] } },
  };

  it("adds the generated gateway's names as one Encore entry when a service makes an Encore app", () => {
    expect(secretSyncPlan("staging", withGateway).at(-1)).toEqual({
      member: "gateway",
      folder: "stackra-encore (generated API gateway)",
      names: ["GATEWAY_VISITOR_SIGNING_KEY"],
      scope: "products/acme/staging",
      writer: "encore",
    });
  });

  it("adds no gateway entry without a service member", () => {
    const noServices: DeployRunways = {
      ...withGateway,
      members: withGateway.members.filter(({ folder }) => folder !== "services"),
    };
    expect(secretSyncPlan("staging", noServices).some(({ member }) => member === "gateway")).toBe(
      false,
    );
  });

  it("syncs the gateway's names into Encore, the value on stdin", async () => {
    const { run, calls } = recorder();
    await syncSecrets({
      environment: "staging",
      runways: withGateway,
      repository: repository(true),
      dryRun: false,
      log: () => {},
      run,
      ci: true,
      env: { ...CANARIES, GATEWAY_VISITOR_SIGNING_KEY: "canary-gateway-5d1e" },
    });
    const gatewayCall = calls.find((call) => call.args.includes("GATEWAY_VISITOR_SIGNING_KEY"));
    expect(gatewayCall?.input).toBe("canary-gateway-5d1e");
  });
});

describe("readMemberSecrets", () => {
  it("returns only the member's declared names from the job's environment, in CI", async () => {
    const values = await readMemberSecrets({
      environment: "staging",
      member: "api",
      runways: RUNWAYS,
      ci: true,
      env: { ...CANARIES, UNDECLARED: "canary-other" },
    });
    expect([...values.keys()]).toEqual(["MAIL_TOKEN", "STRIPE_SECRET_KEY"]);
    expect(values.get("STRIPE_SECRET_KEY")).toBe(CANARIES.STRIPE_SECRET_KEY);
  });

  it("refuses outside CI before reading anything", async () => {
    expect(
      await rejection(
        readMemberSecrets({
          environment: "staging",
          member: "api",
          runways: RUNWAYS,
          ci: false,
          env: { ...CANARIES },
        }),
      ),
    ).toMatch(/only in a CI deploy job/);
  });

  /** GITHUB_ACTIONS=true is not proof: without the runner's OIDC token nothing is read. */
  it("refuses a self-asserted CI job (GITHUB_ACTIONS=true and no OIDC token)", async () => {
    const before = { ...process.env };
    process.env["GITHUB_ACTIONS"] = "true";
    Reflect.deleteProperty(process.env, "ACTIONS_ID_TOKEN_REQUEST_URL");
    Reflect.deleteProperty(process.env, "ACTIONS_ID_TOKEN_REQUEST_TOKEN");
    try {
      expect(
        await rejection(
          readMemberSecrets({
            environment: "staging",
            member: "api",
            runways: RUNWAYS,
            env: { ...CANARIES },
          }),
        ),
      ).toMatch(/no GitHub OIDC token can be requested here/);
    } finally {
      process.env = before;
    }
  });

  it("names a missing secret and the scope to decrypt, without any value", async () => {
    const message = await rejection(
      readMemberSecrets({
        environment: "staging",
        member: "api",
        runways: RUNWAYS,
        ci: true,
        env: { STRIPE_SECRET_KEY: CANARIES.STRIPE_SECRET_KEY },
      }),
    );
    expect(message).toMatch(
      /lacks api's MAIL_TOKEN: decrypt products\/acme\/staging first \(\.github\/actions\/secrets-decrypt\)/,
    );
    expectNoValue(message);
  });
});

describe("syncSecrets", () => {
  it("writes each service secret into Encore once, the value on stdin, and prints names only", async () => {
    const { run, calls } = recorder();
    const lines: string[] = [];
    await syncSecrets({
      environment: "staging",
      runways: RUNWAYS,
      repository: repository(true),
      dryRun: false,
      log: (line) => lines.push(line),
      run,
      ci: true,
      env: { ...CANARIES },
    });
    expect(calls).toEqual([
      expect.objectContaining({
        command: "encore",
        args: ["secret", "set", "--env", "staging-eu", "MAIL_TOKEN"],
        input: CANARIES.MAIL_TOKEN,
      }),
      expect.objectContaining({
        command: "encore",
        args: ["secret", "set", "--env", "staging-eu", "STRIPE_SECRET_KEY"],
        input: CANARIES.STRIPE_SECRET_KEY,
      }),
    ]);
    for (const { args } of calls) expectNoValue(args.join(" "));
    expectNoValue(lines.join("\n"));
    expect(lines).toContain(
      "cloudflare-workers workers/edge: EDGE_KEY, set by the Workers provider at deploy",
    );
    expect(lines).toContain("eas apps/field: SENTRY_DSN, not synced yet (STA-2009)");
    expect(lines).toContain("set STRIPE_SECRET_KEY in encore staging-eu");
  });

  it("reads nothing on a dry run, even outside CI", async () => {
    const { run, calls } = recorder();
    const lines: string[] = [];
    await syncSecrets({
      environment: "staging",
      runways: RUNWAYS,
      repository: repository(false),
      dryRun: true,
      log: (line) => lines.push(line),
      run,
      ci: false,
      env: { ...CANARIES },
    });
    expect(calls).toEqual([]);
    expect(lines[0]).toBe(
      "encore staging-eu ← sops products/acme/staging: MAIL_TOKEN, STRIPE_SECRET_KEY (services/api)",
    );
    expectNoValue(lines.join("\n"));
  });

  it("writes nothing when a value is missing", async () => {
    const { run, calls } = recorder();
    const message = await rejection(
      syncSecrets({
        environment: "staging",
        runways: RUNWAYS,
        repository: repository(true),
        dryRun: false,
        log: () => undefined,
        run,
        ci: true,
        env: { MAIL_TOKEN: CANARIES.MAIL_TOKEN },
      }),
    );
    expect(message).toMatch(/lacks api's STRIPE_SECRET_KEY/);
    expectNoValue(message);
    expect(calls).toEqual([]);
  });

  it("keeps a failed write's output out of the error", async () => {
    let thrown: unknown;
    try {
      await syncSecrets({
        environment: "staging",
        runways: RUNWAYS,
        repository: repository(true),
        dryRun: false,
        log: () => undefined,
        run: failing,
        ci: true,
        env: { ...CANARIES },
      });
    } catch (error) {
      thrown = error;
    }
    expect((thrown as Error).message).toMatch(/encore secret set MAIL_TOKEN in staging-eu failed/);
    expectNoValue((thrown as Error).message);
    expect((thrown as Error).cause).toBeUndefined();
  });

  it("writes from a folder that names the runway's Encore app, whatever the generated layout", async () => {
    const { run, calls } = recorder();
    await syncSecrets({
      environment: "staging",
      runways: RUNWAYS,
      repository: repository(false),
      dryRun: false,
      log: () => undefined,
      run,
      ci: true,
      env: { ...CANARIES },
    });
    expect(calls.length).toBeGreaterThan(0);
    for (const write of calls)
      expect(JSON.parse(write.app ?? "{}")).toMatchObject({ id: "acme-x1" });
  });

  it("refuses to write without an Encore app id in the root runway", async () => {
    const { run } = recorder();
    const { encore: _, ...providers } = RUNWAYS.root.providers;
    expect(
      await rejection(
        syncSecrets({
          environment: "staging",
          runways: { ...RUNWAYS, root: { ...RUNWAYS.root, providers } },
          repository: repository(false),
          dryRun: false,
          log: () => undefined,
          run,
          ci: true,
          env: { ...CANARIES },
        }),
      ),
    ).toMatch(/providers\.encore\.app/);
  });
});
