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

/** `text` in a terminal's green. */
const green = (text: string) => `\u001b[32m${text}\u001b[0m`;

/** The overview table `encore secret list` prints (its marks coloured, as on a terminal), one row per name. */
function listing(rows: readonly string[]): string {
  return [
    "Secret Key   Production   Development   Local   Preview   Specific Envs",
    ...rows.map((row) => row.replaceAll("\u2713", green("\u2713"))),
    "",
  ].join("\n");
}

/**
 * A runner that records every call and the encore.app of an Encore write's working directory; `encore secret list`
 * answers `list` (a string, or an error to throw).
 */
function recorder(list: string | Error = listing([])): {
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
    if (command === "encore" && args[0] === "secret" && args[1] === "list") {
      if (list instanceof Error) throw list;
      return list;
    }
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

/** The runways with one service whose code declares SENTRY_DSN optional (`required: false`). */
const WITH_OPTIONAL: DeployRunways = {
  root: RUNWAYS.root,
  members: [
    {
      member: "api",
      folder: "services",
      env: [
        { name: "STRIPE_SECRET_KEY", kind: "secret", required: true },
        { name: "SENTRY_DSN", kind: "secret", required: false },
      ],
      runway: {},
    },
  ],
};

/** Syncs WITH_OPTIONAL into staging-eu with no SENTRY_DSN in the scope; answers the calls and the lines. */
async function syncWithout(list: string | Error) {
  const { run, calls } = recorder(list);
  const lines: string[] = [];
  await syncSecrets({
    environment: "staging",
    runways: WITH_OPTIONAL,
    repository: repository(true),
    dryRun: false,
    log: (line) => lines.push(line),
    run,
    ci: true,
    env: { STRIPE_SECRET_KEY: CANARIES.STRIPE_SECRET_KEY },
  });
  const writes = calls.filter(({ args }) => args[1] === "set").map(({ args }) => args.at(-1));
  return { writes, lines };
}

describe("placeholders (STA-258)", () => {
  it("lists a member's optional names as its placeholders", () => {
    expect(secretSyncPlan("staging", WITH_OPTIONAL)).toEqual([
      {
        member: "api",
        folder: "services/api",
        names: ["SENTRY_DSN", "STRIPE_SECRET_KEY"],
        placeholders: ["SENTRY_DSN"],
        scope: "products/acme/staging",
        writer: "encore",
      },
    ]);
  });

  it("reads an absent or empty optional name as an empty placeholder, never a required one", async () => {
    for (const env of [
      { STRIPE_SECRET_KEY: CANARIES.STRIPE_SECRET_KEY },
      { STRIPE_SECRET_KEY: CANARIES.STRIPE_SECRET_KEY, SENTRY_DSN: "" },
    ]) {
      const values = await readMemberSecrets({
        environment: "staging",
        member: "api",
        runways: WITH_OPTIONAL,
        ci: true,
        env,
      });
      expect(values.get("SENTRY_DSN")).toBe("");
      expect(values.get("STRIPE_SECRET_KEY")).toBe(CANARIES.STRIPE_SECRET_KEY);
    }
    expect(
      await rejection(
        readMemberSecrets({
          environment: "staging",
          member: "api",
          runways: WITH_OPTIONAL,
          ci: true,
          env: { SENTRY_DSN: "canary-sentry" },
        }),
      ),
    ).toMatch(/lacks api's STRIPE_SECRET_KEY:/);
  });

  it("writes an absent optional name into Encore as an empty placeholder when Encore holds none, and says so", async () => {
    // STRIPE_SECRET_KEY is held; SENTRY_DSN only for another environment, so staging-eu holds no value for it.
    const { run, calls } = recorder(
      listing([
        "STRIPE_SECRET_KEY   \u2713   \u2713   \u2717   \u2717",
        "SENTRY_DSN   \u2717   \u2717   \u2717   \u2717   production",
      ]),
    );
    const lines: string[] = [];
    await syncSecrets({
      environment: "staging",
      runways: WITH_OPTIONAL,
      repository: repository(true),
      dryRun: false,
      log: (line) => lines.push(line),
      run,
      ci: true,
      env: { STRIPE_SECRET_KEY: CANARIES.STRIPE_SECRET_KEY },
    });
    expect(calls.map(({ args, input }) => ({ name: args.at(-1), input }))).toEqual([
      { name: "list", input: undefined },
      { name: "SENTRY_DSN", input: "" },
      { name: "STRIPE_SECRET_KEY", input: CANARIES.STRIPE_SECRET_KEY },
    ]);
    expect(lines).toContain(
      "encore staging-eu ← sops products/acme/staging: SENTRY_DSN (optional), STRIPE_SECRET_KEY (services/api)",
    );
    expect(lines).toContain(
      "set SENTRY_DSN in encore staging-eu as an empty placeholder (optional, no value in the scope)",
    );
    expect(lines).toContain("set STRIPE_SECRET_KEY in encore staging-eu");
    expectNoValue(lines.join("\n"));
  });

  it("never empties a value Encore already holds for an absent optional name", async () => {
    // Set by hand for an environment type, for staging-eu itself, or both: each keeps its value.
    for (const row of [
      "SENTRY_DSN   \u2713   \u2717   \u2717   \u2717",
      "SENTRY_DSN   \u2717   \u2713   \u2717   \u2717",
      "SENTRY_DSN   \u2717   \u2717   \u2717   \u2717   production,staging-eu",
    ]) {
      const { writes, lines } = await syncWithout(listing([row]));
      expect(writes).toEqual(["STRIPE_SECRET_KEY"]);
      expect(lines).toContain(
        "kept SENTRY_DSN in encore staging-eu: optional, no value in the scope, and Encore already holds one",
      );
      expectNoValue(lines.join("\n"));
    }
  });

  it("writes no placeholder when encore secret list cannot be read or is not the table", async () => {
    for (const list of [new Error("encore secret list failed"), "not logged in\n"]) {
      const { writes, lines } = await syncWithout(list);
      expect(writes).toEqual(["STRIPE_SECRET_KEY"]);
      expect(lines).toContain(
        "left SENTRY_DSN in encore staging-eu as it is: optional, no value in the scope, and encore secret list could not be read",
      );
    }
  });

  it("leaves an optional config name the scope lacks unset, never empty, so its default applies", async () => {
    const withDefault: DeployRunways = {
      root: RUNWAYS.root,
      members: [
        {
          member: "api",
          folder: "services",
          env: [
            { name: "STRIPE_SECRET_KEY", kind: "secret", required: true },
            { name: "API_TIMEOUT", kind: "config", required: false },
          ],
          runway: {},
        },
      ],
    };
    expect(secretSyncPlan("staging", withDefault)).toEqual([
      {
        member: "api",
        folder: "services/api",
        names: ["API_TIMEOUT", "STRIPE_SECRET_KEY"],
        defaults: ["API_TIMEOUT"],
        scope: "products/acme/staging",
        writer: "encore",
      },
    ]);
    for (const env of [
      { STRIPE_SECRET_KEY: CANARIES.STRIPE_SECRET_KEY },
      { STRIPE_SECRET_KEY: CANARIES.STRIPE_SECRET_KEY, API_TIMEOUT: "" },
    ]) {
      const values = await readMemberSecrets({
        environment: "staging",
        member: "api",
        runways: withDefault,
        ci: true,
        env,
      });
      expect([...values.keys()]).toEqual(["STRIPE_SECRET_KEY"]);
    }
    // A value in the scope is synced like any other.
    const held = await readMemberSecrets({
      environment: "staging",
      member: "api",
      runways: withDefault,
      ci: true,
      env: { STRIPE_SECRET_KEY: CANARIES.STRIPE_SECRET_KEY, API_TIMEOUT: "30" },
    });
    expect(held.get("API_TIMEOUT")).toBe("30");

    const { run, calls } = recorder(new Error("must not be asked"));
    const lines: string[] = [];
    await syncSecrets({
      environment: "staging",
      runways: withDefault,
      repository: repository(true),
      dryRun: false,
      log: (line) => lines.push(line),
      run,
      ci: true,
      env: { STRIPE_SECRET_KEY: CANARIES.STRIPE_SECRET_KEY },
    });
    expect(calls.map(({ args, input }) => ({ name: args.at(-1), input }))).toEqual([
      { name: "STRIPE_SECRET_KEY", input: CANARIES.STRIPE_SECRET_KEY },
    ]);
    expect(lines).toContain(
      "encore staging-eu ← sops products/acme/staging: API_TIMEOUT (optional, has a default), STRIPE_SECRET_KEY (services/api)",
    );
    expect(lines).toContain(
      "left API_TIMEOUT in encore staging-eu as it is: optional config with no value in the scope, so its default applies",
    );
    expectNoValue(lines.join("\n"));
  });

  it("never empties a name one service reads as optional config with a default, though another's is an optional secret", async () => {
    // api declares API_TIMEOUT as an optional secret (an empty placeholder), billing as optional config with a default.
    // Encore secrets are app-wide, so an empty write for api would override billing's default.
    const shared: DeployRunways = {
      root: RUNWAYS.root,
      members: [
        {
          member: "api",
          folder: "services",
          env: [
            { name: "STRIPE_SECRET_KEY", kind: "secret", required: true },
            { name: "API_TIMEOUT", kind: "secret", required: false },
          ],
          runway: {},
        },
        {
          member: "billing",
          folder: "services",
          env: [{ name: "API_TIMEOUT", kind: "config", required: false }],
          runway: {},
        },
      ],
    };
    for (const members of [shared.members, shared.members.toReversed()]) {
      // Encore holds no value for it, so the old sync wrote "" over billing's default.
      const { run, calls } = recorder(listing([]));
      const lines: string[] = [];
      await syncSecrets({
        environment: "staging",
        runways: { root: shared.root, members },
        repository: repository(true),
        dryRun: false,
        log: (line) => lines.push(line),
        run,
        ci: true,
        env: { STRIPE_SECRET_KEY: CANARIES.STRIPE_SECRET_KEY },
      });
      expect(calls.map(({ args, input }) => ({ name: args.at(-1), input }))).toEqual([
        { name: "STRIPE_SECRET_KEY", input: CANARIES.STRIPE_SECRET_KEY },
      ]);
      expect(lines).toContain(
        "left API_TIMEOUT in encore staging-eu as it is: optional config with no value in the scope, so its default applies",
      );
      expectNoValue(lines.join("\n"));
    }
    // A value in the scope is still written for both.
    const { run, calls } = recorder(new Error("must not be asked"));
    await syncSecrets({
      environment: "staging",
      runways: shared,
      repository: repository(true),
      dryRun: false,
      log: () => undefined,
      run,
      ci: true,
      env: { STRIPE_SECRET_KEY: CANARIES.STRIPE_SECRET_KEY, API_TIMEOUT: "30" },
    });
    expect(calls.map(({ args, input }) => ({ name: args.at(-1), input }))).toEqual([
      { name: "API_TIMEOUT", input: "30" },
      { name: "STRIPE_SECRET_KEY", input: CANARIES.STRIPE_SECRET_KEY },
    ]);
  });

  it("asks Encore nothing when every value is in the scope", async () => {
    const { run, calls } = recorder(new Error("must not be asked"));
    await syncSecrets({
      environment: "staging",
      runways: WITH_OPTIONAL,
      repository: repository(true),
      dryRun: false,
      log: () => undefined,
      run,
      ci: true,
      env: { STRIPE_SECRET_KEY: CANARIES.STRIPE_SECRET_KEY, SENTRY_DSN: "canary-sentry" },
    });
    expect(calls.map(({ args }) => args.slice(0, 2).join(" "))).toEqual([
      "secret set",
      "secret set",
    ]);
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
