/**
 * Stackra file contract:
 * Purpose: unit and type tests of `parseRunway`: the template's root, app and service runway shapes pass with defaults
 *          applied and typed per kind; a member runway refuses the root keys (`member`, `deployable`, `isolate`,
 *          `group`, `cpu`, `memory`, `instances`) at the top and in an environment; a dedicated resource needs a
 *          reason; a deferred engine, a version other than 3, a misspelt environment, a duplicated secret and an
 *          inverted instance range fail with their paths.
 * Boundary: test only; the fixtures mirror the template's `runway.yaml` files, trimmed.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0296 (decisions 1, 2
 *                     and 5, and enforcement); ADR 0227.
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
  release: {
    pwa: { updates: "from-config", betaBadgeOutsideProduction: true },
    desktop: {
      channels: ["beta", "latest"],
      signing: { mac: false, windows: false },
      feedPath: "console",
      platforms: { mac: ["dmg", "zip"], windows: ["nsis"], linux: ["AppImage"] },
    },
  },
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
      e2e: { baseUrl: "from-port", seeds: "from-stackra-config" },
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
      aliases: ["app.acme.example"],
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
  targets: { "electron-release": { feed: { publicOrigin: "https://downloads.acme.example" } } },
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

  it("parses the template's app runway, typed AppRunway, with defaults applied", () => {
    const app = parseRunway("app", CONSOLE);

    expectTypeOf(app).toEqualTypeOf<AppRunway>();
    expect(app.release?.desktop?.feedPath).toBe("console");
    expect(app.environments.dev?.desktop?.remoteDebugPort).toBe(9222);
    expect(
      parseRunway("app", { version: 3, environments: { dev: { port: 3333 } } }).secrets,
    ).toEqual([]);
  });

  it("parses the template's root runway, typed RootRunway, keeping open provider blocks", () => {
    const root = parseRunway("root", ROOT);

    expectTypeOf(root).toEqualTypeOf<RootRunway>();
    expect(root.environments.production?.topology.groups?.commerce?.instances).toEqual({
      min: 2,
      max: 10,
    });
    expect(root.environments.dev?.["infra"]).toEqual({ gateway: { port: 4000 } });
    expect(root.targets?.["electron-release"]?.feed?.publicOrigin).toBe(
      "https://downloads.acme.example",
    );
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
    const shared = parseRunway("service", {
      version: 3,
      requires: { search: { engine: "postgres" } },
      environments: {},
    });
    expect(shared.requires?.search).toEqual({ engine: "postgres", dedicated: false });
  });

  it("refuses an engine ADR 0227 defers, naming the allowed ones", () => {
    expect(() =>
      parseRunway("service", {
        version: 3,
        requires: { search: { dedicated: true, engine: "typesense", reason: "fast search" } },
        environments: {},
      }),
    ).toThrow(/ADR 0227 allows: postgres, valkey/);
  });

  it("names the path of each invalid value", () => {
    expect(issuePaths(() => parseRunway("app", { ...CONSOLE, version: 2 }))).toEqual(["version"]);
    expect(
      issuePaths(() => parseRunway("app", { version: 3, environments: { prod: {} } })),
    ).toEqual(["environments.prod"]);
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
