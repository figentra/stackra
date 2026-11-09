/**
 * Stackra file contract:
 * Purpose: unit and type tests of `parseRunway` against the canonical runway v3 schemas: the template's root, app and
 *          service runway shapes pass, typed per kind, with nothing added; a member runway refuses the root keys
 *          (`member`, `deployable`, `isolate`, `group`, `cpu`, `memory`, `instances`) at the top and in an
 *          environment; a dedicated resource needs a non-empty reason; the engines are ADR 0296's four; a database
 *          extension is one ADR 0160 approves; a grouped
 *          topology needs groups and lists a member once; the root's environments, `secrets` and `destinations` are
 *          closed, as are the known targets, the edge, release, observability and GitHub blocks (STA-1975, STA-1976),
 *          while the other provider blocks, other targets and the member size blocks stay open; the config layer selects
 *          the Postgres action stores by name; a var reference names
 *          exactly one origin; the npm provider's registry is an https URL ending in / and its scope an npm scope;
 *          a version other than 3, a misspelt environment, a duplicated secret and an inverted
 *          instance range fail with their paths.
 * Boundary: test only; the fixtures mirror the template's `runway.yaml` files, trimmed.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0296 (decisions 1, 2
 *                     and 5, its 2026-10-24 note, and enforcement); ADR 0227; ADR 0294 (decision 4, store drivers);
 *                     ADR 0160 (decision 2 and its notes).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import { parseRunway } from "#core/functions/parse-runway.function";
import type { AppRunway } from "#core/types/app-runway.type";
import type { RootRunway } from "#core/types/root-runway.type";
import type { ServiceRunway } from "#core/types/service-runway.type";

const COMMERCE = {
  $schema: "@stackra/runway/schema/service.json",
  version: 3,
  requires: {
    cache: {
      dedicated: true,
      engine: "valkey",
      reason: "query-cache entries and rate-limit counters need volatile-ttl eviction of their own",
    },
  },
  secrets: ["PRICING_API_KEY"],
  health: {
    readiness: { requireMigrations: true, timeoutSeconds: 2 },
    liveness: { eventLoopLagMs: 1000 },
  },
  environments: {
    dev: {
      port: 4001,
      database: { extensions: ["ltree", "pg_trgm"] },
      crons: { enabled: false },
      config: {
        commerce: { storefrontBaseUrl: { "from-member": "web" } },
        loyalty_kit: { ledger: "memory" },
      },
    },
    production: {
      database: {
        storageGb: 100,
        extensions: ["ltree", "pg_trgm"],
        readReplica: false,
        poolBudget: 50,
      },
      cache: { memoryMb: 1024, eviction: "volatile-ttl" },
      buckets: { product_images: { storageGb: 50 } },
      queues: { default: { visibilityTimeoutSeconds: 300, dlq: true } },
      crons: { enabled: true },
    },
  },
};

const CONSOLE = {
  $schema: "@stackra/runway/schema/app.json",
  version: 3,
  secrets: [],
  health: { path: "/healthz", expects: "sha" },
  release: { desktop: { feedPath: "console" } },
  telemetry: { sentryProject: "acme-console" },
  environments: {
    dev: {
      port: 5173,
      host: "localhost",
      https: false,
      open: false,
      desktop: { devtools: true, remoteDebugPort: 9222, pkceLoopbackPort: 5179 },
      vars: { VITE_SENTRY_DSN: "", EXPO_PUBLIC_API_ORIGIN: { "from-port": "gateway" } },
      config: { "logger.telemetry": { traces: { sampleRate: 1 } } },
    },
    preview: {
      domain: "console-pr-${pr}.preview.acme.example",
      vars: {
        VITE_API_ORIGIN: "https://api-pr-${pr}.preview.acme.example",
        VITE_SENTRY_DSN: "ref:sentry.dsn.console",
      },
    },
    production: {
      domain: "console.acme.example",
      workers: { observability: { headSamplingRate: 0.1 } },
      desktop: { channel: "latest" },
    },
  },
};

const ROOT = {
  $schema: "@stackra/runway/schema/root.json",
  version: 3,
  project: "acme-platform",
  providers: { encore: { app: "acme-platform" } },
  environments: {
    dev: {
      destinations: { services: "compose", web: "vite-dev" },
      infra: { gateway: { port: 4000 } },
      lanes: { enabled: true, portStep: 100, from: "STACKRA_LANE" },
      topology: { mode: "monolith" },
      defaults: { service: { config: { queue: { driver: "memory" } } } },
    },
    production: {
      destinations: { services: "encore-cloud" },
      topology: {
        mode: "grouped",
        isolate: [],
        groups: {
          commerce: {
            members: ["commerce"],
            cpu: 1,
            memory: "2Gi",
            instances: { min: 2, max: 10 },
            scaling: { metric: "cpu", target: 60 },
            workers: { split: true, cpu: 0.5, memory: "1Gi", instances: { min: 1, max: 4 } },
          },
        },
      },
    },
  },
  targets: {
    "electron-release": {
      feed: { bucket: "downloads", publicOrigin: "https://downloads.acme.example" },
    },
  },
  secrets: {
    sync: "on-deploy",
    defaultPath: "runtime",
    ci: ["EXPO_TOKEN"],
    gateway: ["GATEWAY_VISITOR_SIGNING_KEY"],
  },
  release: { promote: { unit: "sha" } },
};

/** The paths of the issues `run` throws. */
function issuePaths(run: () => unknown): string[] {
  try {
    run();
  } catch (error) {
    if (error instanceof RunwayInvalidError) return error.issues.map((issue) => issue.path);
    throw error;
  }
  throw new Error("expected a RunwayInvalidError");
}

/** The issue paths of a service runway whose staging environment has the given `events` block. */
function refused(events: unknown): string[] {
  return issuePaths(() =>
    parseRunway("service", { version: 3, environments: { staging: { events } } }),
  );
}

/** Parses an app runway whose dev environment has the given vars. */
function parseVars(vars: Record<string, unknown>): unknown {
  return parseRunway("app", { version: 3, environments: { dev: { vars } } });
}

/** Parses a service runway whose dev database names `extensions`. */
function withExtensions(extensions: string[]) {
  return parseRunway("service", {
    version: 3,
    environments: { dev: { database: { extensions } } },
  });
}

describe("parseRunway", () => {
  it("parses the template's service runway, typed ServiceRunway", () => {
    const commerce = parseRunway("service", COMMERCE, "services/commerce/runway.yaml");

    expectTypeOf(commerce).toEqualTypeOf<ServiceRunway>();
    expect(commerce.requires?.cache).toEqual({
      dedicated: true,
      engine: "valkey",
      reason: COMMERCE.requires.cache.reason,
    });
    expect(commerce.environments.production?.cache?.eviction).toBe("volatile-ttl");
  });

  it("parses the template's app runway, typed AppRunway, adding no defaults", () => {
    const app = parseRunway("app", CONSOLE);

    expectTypeOf(app).toEqualTypeOf<AppRunway>();
    expect(app.release?.desktop?.feedPath).toBe("console");
    expect(app.environments.dev?.desktop?.remoteDebugPort).toBe(9222);
    const docs = { version: 3, environments: { dev: { port: 3333 } } };
    expect(parseRunway("app", docs)).toEqual(docs);
  });

  it("parses the template's root runway, typed RootRunway, keeping open provider blocks", () => {
    const root = parseRunway("root", ROOT);

    expectTypeOf(root).toEqualTypeOf<RootRunway>();
    expect(root.environments.production?.topology?.groups?.commerce?.instances).toEqual({
      min: 2,
      max: 10,
    });
    expect(root.environments.dev?.infra).toEqual({ gateway: { port: 4000 } });
    expect(root.targets?.["electron-release"]?.["feed"]).toEqual({
      bucket: "downloads",
      publicOrigin: "https://downloads.acme.example",
    });
  });

  it("accepts a GCP project as a plain value or an { id, number } object, and refuses a list", () => {
    const projects = {
      nonprod: "ref:gcp.nonprod",
      prod: { id: "acme-prod", number: "123456789012" },
    };
    const root = parseRunway("root", { ...ROOT, providers: { gcp: { projects } } });

    expect(root.providers?.gcp?.projects).toEqual(projects);
    expect(() =>
      parseRunway("root", { ...ROOT, providers: { gcp: { projects: { prod: ["acme-prod"] } } } }),
    ).toThrow(/providers\.gcp\.projects\.prod/);
  });

  it("types the npm provider: an https registry ending in / and an npm scope (ADR 0453)", () => {
    const npm = { registry: "https://npm.stackra.figentra.com/", scope: "@stackra" };
    expect(parseRunway("root", { ...ROOT, providers: { npm } }).providers?.npm).toEqual(npm);
    expect(
      issuePaths(() =>
        parseRunway("root", {
          ...ROOT,
          providers: { npm: { registry: "http://npm.stackra.figentra.com", scope: "stackra" } },
        }),
      ).sort(),
    ).toEqual(["providers.npm.registry", "providers.npm.scope"]);
  });

  it("selects the Postgres action stores by name in the config layer, root and member alike", () => {
    const stores = { idempotency: "postgres", rateLimit: "postgres" };
    const root = parseRunway("root", {
      ...ROOT,
      environments: {
        ...ROOT.environments,
        production: {
          ...ROOT.environments.production,
          defaults: { service: { config: { "actions.stores": stores } } },
        },
      },
    });
    const service = parseRunway("service", {
      version: 3,
      environments: { staging: { config: { "actions.stores": stores } } },
    });

    expect(root.environments.production?.defaults?.service?.config?.["actions.stores"]).toEqual(
      stores,
    );
    expect(service.environments.staging?.config?.["actions.stores"]).toEqual(stores);
  });

  it("types the known targets, refusing a misspelt key, and leaves another destination open", () => {
    const targets = {
      "encore-cloud": { cloud: "aws" },
      "cloudflare-workers": {
        compatibilityDate: "2026-10-01",
        observability: { headSamplingRate: 0.1 },
        workflows: { static: "deploy-static.yml" },
      },
      eas: {
        buildTrigger: "fingerprint",
        monthlyBuildCap: 60,
        ota: {
          rollout: { startPercent: 10, endPercent: 100, stepHours: 24 },
          rollback: "republish-previous",
        },
        minimumVersion: { gate: true, supportedStoreVersions: 2 },
      },
      mintlify: { deployOn: "merge-to-main", branch: "docs-site", adminKey: "MINTLIFY_ADMIN_KEY" },
      npm: { access: "public", provenance: true, trustedPublisher: "release.yml" },
      "vite-dev": { anything: true },
    };
    const root = parseRunway("root", { ...ROOT, targets });
    expect(root.targets?.["eas"]).toMatchObject({ monthlyBuildCap: 60 });
    expect(root.targets?.["vite-dev"]).toEqual({ anything: true });
    expect(
      issuePaths(() =>
        parseRunway("root", {
          ...ROOT,
          targets: { ...targets, eas: { ...targets.eas, ota: { rolout: { startPercent: 10 } } } },
        }),
      ),
    ).toEqual(["targets.eas.ota"]);
    expect(
      issuePaths(() =>
        parseRunway("root", {
          ...ROOT,
          targets: { ...targets, mintlify: { adminKey: "a-secret-value" } },
        }),
      ),
    ).toEqual(["targets.mintlify.adminKey"]);
  });

  it("closes the edge, release, observability and GitHub blocks (repository metadata included), refusing a misspelt key", () => {
    const sections = {
      edge: {
        proxy: "all",
        waf: "managed",
        rateLimit: { perIp: { requests: 100, periodSeconds: 10 } },
      },
      release: {
        buildOrder: ["schemas", "services"],
        gate: { health: "/health", errorWatchMinutes: 15 },
        windows: {
          avoid: [
            { local: "08:00-10:00", days: "sun-thu" },
            { termStart: { firstDays: 3, source: "calendar" } },
          ],
        },
      },
      observability: {
        logs: { hotDays: 30 },
        uptime: [{ name: "api", url: "https://api.acme.example/health" }],
      },
      providers: {
        github: {
          org: "acme",
          repo: "platform",
          description: "Acme Platform: the services every Acme product runs on.",
          topics: ["acme", "typescript"],
          homepage: "https://docs.acme.example",
          environments: { production: { reviewers: ["acme/owners"] } },
        },
      },
    };
    const root = parseRunway("root", { ...ROOT, ...sections });
    expect(root.edge).toEqual(sections.edge);
    expect(root.providers?.github).toEqual(sections.providers.github);
    expect(
      issuePaths(() =>
        parseRunway("root", {
          ...ROOT,
          edge: { tls: { minVerison: "1.2" } },
          release: { gate: { helth: "/health" } },
          observability: { log: {} },
          providers: { github: { org: "acme", repo: "platform", enviroments: {} } },
        }),
      ).sort(),
    ).toEqual(["edge.tls", "observability", "providers.github", "release.gate"]);
  });

  it("refuses an upper-case or repeated GitHub topic, more than 20 topics, and a relative homepage", () => {
    for (const metadata of [
      { topics: ["TypeScript"] },
      { topics: ["acme", "acme"] },
      { topics: Array.from({ length: 21 }, (_, i) => `t${i}`) },
      { homepage: "docs.acme.example" },
    ])
      expect(
        issuePaths(() =>
          parseRunway("root", {
            ...ROOT,
            providers: { github: { org: "acme", repo: "platform", ...metadata } },
          }),
        ).some((path) => path.startsWith("providers.github")),
      ).toBe(true);
  });

  it("refuses root keys in a member runway", () => {
    for (const key of ["member", "deployable", "isolate", "group", "cpu", "memory", "instances"]) {
      expect(() => parseRunway("service", { ...COMMERCE, [key]: "x" })).toThrow(RunwayInvalidError);
      expect(() =>
        parseRunway("service", { version: 3, environments: { production: { [key]: 1 } } }),
      ).toThrow(RunwayInvalidError);
      expect(() =>
        parseRunway("app", { version: 3, environments: { staging: { [key]: 1 } } }),
      ).toThrow(RunwayInvalidError);
    }
  });

  it("requires a reason for a dedicated resource, and none for a shared one", () => {
    expect(
      issuePaths(() =>
        parseRunway("service", {
          version: 3,
          requires: { search: { dedicated: true, engine: "postgres" } },
          environments: {},
        }),
      ),
    ).toEqual(["requires.search.reason"]);
    expect(
      issuePaths(() =>
        parseRunway("service", {
          version: 3,
          requires: { search: { dedicated: true, engine: "postgres", reason: "" } },
          environments: {},
        }),
      ),
    ).toEqual(["requires.search.reason"]);
    const shared = parseRunway("service", {
      version: 3,
      requires: { search: { engine: "postgres" }, mail: { engine: "valkey", dedicated: false } },
      environments: {},
    });
    expect(shared.requires?.search).toEqual({ engine: "postgres" });
    expect(() =>
      parseRunway("service", { version: 3, requires: { cache: {} }, environments: {} }),
    ).toThrow(RunwayInvalidError);
  });

  it("allows the four engines ADR 0296 lists and refuses a deferred one, naming them", () => {
    for (const engine of ["postgres", "valkey", "s3", "sns-sqs"]) {
      expect(
        parseRunway("app", { version: 3, requires: { store: { engine } }, environments: {} })
          .requires?.store?.engine,
      ).toBe(engine);
    }
    expect(() =>
      parseRunway("service", {
        version: 3,
        requires: { search: { dedicated: true, engine: "typesense", reason: "fast search" } },
        environments: {},
      }),
    ).toThrow(/ADR 0296 allows: postgres, valkey, s3, sns-sqs/);
  });

  it("allows the approved database extensions and refuses another, naming them", () => {
    expect(
      withExtensions(["btree_gist", "pg_stat_statements", "postgis"]).environments.dev?.database
        ?.extensions,
    ).toEqual(["btree_gist", "pg_stat_statements", "postgis"]);
    expect(issuePaths(() => withExtensions(["ltree", "pg_cron"]))).toEqual([
      "environments.dev.database.extensions.1",
    ]);
    expect(() => withExtensions(["timescaledb"])).toThrow(
      /approved extension \(ADR 0160\): vector, pg_trgm, ltree, citext, pgcrypto, postgis, pg_stat_statements, btree_gist/,
    );
  });

  it("needs groups in a grouped topology and lists a member once", () => {
    const grouped = (topology: unknown) =>
      parseRunway("root", { ...ROOT, environments: { staging: { topology } } });

    expect(issuePaths(() => grouped({ mode: "grouped", default: "core" }))).toEqual([
      "environments.staging.topology.groups",
    ]);
    expect(
      issuePaths(() => grouped({ mode: "monolith", isolate: ["identity", "identity"] })),
    ).toEqual(["environments.staging.topology.isolate"]);
    expect(
      issuePaths(() =>
        grouped({ mode: "grouped", groups: { core: { members: ["commerce", "commerce"] } } }),
      ),
    ).toEqual(["environments.staging.topology.groups.core.members"]);
    expect(
      grouped({ mode: "grouped", groups: { core: { members: ["commerce"] } } }).environments.staging
        ?.topology?.groups?.core,
    ).toEqual({ members: ["commerce"] });
    expect(parseRunway("root", { ...ROOT, environments: { dev: {} } }).environments.dev).toEqual(
      {},
    );
  });

  it("closes the root's environments, secrets and destinations, and its project spelling", () => {
    const root = (patch: Record<string, unknown>) => () =>
      parseRunway("root", { ...ROOT, ...patch });

    expect(issuePaths(root({ environments: { dev: { deployables: [] } } }))).toEqual([
      "environments.dev",
    ]);
    expect(issuePaths(root({ secrets: { runtime: ["A_KEY"] } }))).toEqual(["secrets"]);
    expect(issuePaths(root({ secrets: { sync: "nightly" } }))).toEqual(["secrets.sync"]);
    expect(issuePaths(root({ secrets: { gateway: ["A_KEY", "A_KEY"] } }))).toEqual([
      "secrets.gateway",
    ]);
    expect(
      issuePaths(root({ environments: { dev: { destinations: { workers: "compose" } } } })),
    ).toEqual(["environments.dev.destinations"]);
    expect(issuePaths(root({ project: "acme_platform" }))).toEqual(["project"]);
    // ADR 0525: an old `providers.infisical` block is an open provider now; `deprecatedFields` warns on it.
    expect(() =>
      root({ providers: { infisical: { domain: "http://infisical.local" } } }),
    ).not.toThrow();
    expect(
      parseRunway("root", {
        ...ROOT,
        providers: { sentry: { org: "acme" } },
        targets: { mintlify: { checks: ["validate"] } },
        environments: { production: { destinations: { docs: "mintlify" }, ttl: "7d" } },
      }).providers?.["sentry"],
    ).toEqual({ org: "acme" });
  });

  it("keeps the member size blocks open and accepts the new member keys", () => {
    const service = parseRunway("service", {
      version: 3,
      environments: {
        dev: { host: "localhost", devConsolePort: 9400 },
        production: {
          database: { plan: "dedicated-large", storageGb: 2.5 },
          cache: { eviction: "volatile-lfu", keyspaceMb: 64 },
          queues: { default: { visibilityTimeoutSeconds: 0 } },
          crons: {},
          secrets: ["PRICING_API_KEY"],
        },
      },
    });
    expect(service.environments.production?.cache).toEqual({
      eviction: "volatile-lfu",
      keyspaceMb: 64,
    });
    const mobile = parseRunway("app", {
      version: 3,
      health: { path: "/healthz" },
      environments: { dev: { mobile: { metroPort: 8081 } } },
    });
    expect(mobile.environments.dev?.mobile?.metroPort).toBe(8081);
    expect(
      issuePaths(() => parseRunway("app", { ...CONSOLE, health: { expects: "200" } })),
    ).toEqual(["health.expects"]);
  });

  // @covers sta-1910:FR-012 @covers sta-1910:FR-015
  it("reads a producer's cross-app events block: a secret name, public keys and subscribers", () => {
    const events = {
      keys: [{ id: "pay-dev-1", publicKey: "MCowBQYDK2VwAyEA" }],
      subscribers: [
        {
          member: "billing",
          inbox: "http://localhost:4012",
          events: ["payments.payment.captured.v1", "payments.payment.failed.v1"],
        },
      ],
    };
    const service = parseRunway("service", { version: 3, environments: { dev: { events } } });
    expect(service.environments.dev?.events?.signingKey).toBe("STACKRA_EVENTS_SIGNING_KEY");
    expect(service.environments.dev?.events?.subscribers[0]?.member).toBe("billing");
    expect(refused({ ...events, signingKey: "sk-live-value" })).toEqual([
      "environments.staging.events.signingKey",
    ]);
    expect(
      refused({
        ...events,
        subscribers: [{ ...events.subscribers[0], inbox: "http://billing.example.com" }],
      }),
    ).toEqual(["environments.staging.events.subscribers.0.inbox"]);
    expect(
      refused({
        ...events,
        subscribers: [{ ...events.subscribers[0], inbox: "https://billing.example.com/events" }],
      }),
    ).toEqual(["environments.staging.events.subscribers.0.inbox"]);
    expect(
      refused({
        ...events,
        subscribers: [{ ...events.subscribers[0], events: ["payments.payment.captured"] }],
      }),
    ).toEqual(["environments.staging.events.subscribers.0.events.0"]);
    expect(refused({ ...events, keys: [...events.keys, ...events.keys] })).toEqual([
      "environments.staging.events.keys",
    ]);
  });

  it("refuses each key STA-2028 removed, naming the block it was in", () => {
    const app = (document: Record<string, unknown>) =>
      issuePaths(() => parseRunway("app", { version: 3, environments: {}, ...document }));
    const dev = (values: Record<string, unknown>) => app({ environments: { dev: values } });
    expect(app({ release: { pwa: {} } })).toEqual(["release"]);
    for (const key of ["channels", "signing", "platforms"])
      expect(app({ release: { desktop: { feedPath: "console", [key]: {} } } })).toEqual([
        "release.desktop",
      ]);
    expect(app({ release: { mobile: { whiteLabel: true } } })).toEqual(["release.mobile"]);
    for (const key of [
      "distribution",
      "developmentClient",
      "simulator",
      "androidApk",
      "autoIncrement",
    ])
      expect(
        app({
          release: { mobile: { profiles: { store: { environment: "production", [key]: true } } } },
        }),
      ).toEqual(["release.mobile.profiles.store"]);
    for (const key of ["aliases", "e2e", "pwa"])
      expect(dev({ [key]: {} })).toEqual(["environments.dev"]);
    expect(dev({ desktop: { devtools: true, rollout: {} } })).toEqual(["environments.dev.desktop"]);
    expect(dev({ mobile: { metroPort: 8081, devClient: true } })).toEqual([
      "environments.dev.mobile",
    ]);
    expect(
      issuePaths(() =>
        parseRunway("root", {
          ...ROOT,
          resources: { db: { kind: "postgres", reason: "residency" } },
        }),
      ),
    ).toEqual(["resources.db"]);
  });

  it("needs a var reference to name exactly one origin, and a var to be SCREAMING_SNAKE", () => {
    expect(issuePaths(() => parseVars({ VITE_ORIGIN: { scheme: "ws" } }))).toEqual([
      "environments.dev.vars.VITE_ORIGIN",
    ]);
    expect(
      issuePaths(() =>
        parseVars({ VITE_ORIGIN: { "from-port": "gateway", "from-member": "console" } }),
      ),
    ).toEqual(["environments.dev.vars.VITE_ORIGIN"]);
    expect(issuePaths(() => parseVars({ vite_origin: "x" }))).toEqual([
      "environments.dev.vars.vite_origin",
    ]);
    expect(
      parseVars({ VITE_ORIGIN: { "from-member": "console", path: "realtime" } }),
    ).toBeDefined();
  });

  it("names the path of each invalid value", () => {
    expect(issuePaths(() => parseRunway("app", { ...CONSOLE, version: 2 }))).toEqual(["version"]);
    expect(
      issuePaths(() => parseRunway("app", { version: 3, environments: { prod: {} } })),
    ).toEqual(["environments"]);
    expect(
      issuePaths(() => parseRunway("service", { ...COMMERCE, secrets: ["A_KEY", "A_KEY"] })),
    ).toEqual(["secrets"]);
    expect(
      issuePaths(() => parseRunway("app", { version: 3, environments: { dev: { port: 70_000 } } })),
    ).toEqual(["environments.dev.port"]);
  });

  it("refuses an inverted instance range and an unknown topology mode", () => {
    const group = ROOT.environments.production.topology.groups.commerce;
    const inverted = {
      ...ROOT,
      environments: {
        production: {
          topology: {
            mode: "grouped",
            groups: { commerce: { ...group, instances: { min: 4, max: 2 } } },
          },
        },
      },
    };
    expect(issuePaths(() => parseRunway("root", inverted))).toEqual([
      "environments.production.topology.groups.commerce.instances.min",
    ]);
    expect(() =>
      parseRunway("root", { ...ROOT, environments: { dev: { topology: { mode: "sharded" } } } }),
    ).toThrow(RunwayInvalidError);
  });

  it("names the default source after the kind", () => {
    expect(() => parseRunway("root", {})).toThrow(/^root runway is invalid: /);
  });
});
