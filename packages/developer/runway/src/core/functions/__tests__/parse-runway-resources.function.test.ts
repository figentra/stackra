/**
 * Stackra file contract:
 * Purpose: unit tests of the root runway's `resources`, `workloads` and `limits` and the service runway's `uses`
 *          (ADR 0493): a Postgres resource sized per environment and a public workload pinned by digest pass; a reserved
 *          kind (kafka), an engine on a non-Postgres kind, a workload without a reason or with a tagged image, an
 *          inverted scale, an empty command, an alias that is not SCREAMING_SNAKE, and a `uses` naming no resource are
 *          refused with their paths; an internal worker with no port or health path passes with its health command, and
 *          a public workload without a port or health path, or a health path without a port, is refused; a workload's
 *          `migrate` command passes, and an empty one or a timeout past an hour is refused.
 * Boundary: test only; plain objects through `parseRunway`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0493 (decisions 1, 3 and 5); spec sta-1640.
 */
import { describe, expect, it } from "@stackra/testing";

import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import { parseRunway } from "#core/functions/parse-runway.function";

const DIGEST = `ghcr.io/zitadel/zitadel@sha256:${"a".repeat(64)}`;

/** A root runway with `extra` merged in. */
function root(extra: Record<string, unknown>): unknown {
  return {
    version: 3,
    project: "academorix",
    environments: { dev: { limits: { monthly: 150 } } },
    resources: {
      "main-db": { kind: "postgres", engine: "rds", version: "17", size: { production: "large" } },
    },
    workloads: {
      zitadel: {
        image: DIGEST,
        port: 8080,
        health: "/debug/healthz",
        expose: "public",
        uses: ["main-db"],
        env: { ZITADEL_EXTERNALSECURE: "true" },
        secrets: ["ZITADEL_MASTERKEY"],
        scale: { production: { min: 2, max: 4 } },
        reason: "Residency: KSA in-country tenants cannot use ZITADEL Cloud",
      },
    },
    ...extra,
  };
}

/** The issue paths a refused root runway reports. */
function pathsOf(document: unknown): string[] {
  try {
    parseRunway("root", document);
  } catch (error) {
    if (error instanceof RunwayInvalidError) return error.issues.map((issue) => issue.path);
    throw error;
  }
  return [];
}

describe("root runway resources and workloads", () => {
  // @covers sta-1640:FR-001
  // @covers sta-1640:FR-002
  it("accepts a sized Postgres resource and a public workload pinned by digest that uses it", () => {
    const parsed = parseRunway("root", root({}));

    expect(parsed.resources?.["main-db"]).toMatchObject({
      kind: "postgres",
      size: { production: "large" },
    });
    expect(parsed.workloads?.["zitadel"]?.uses).toEqual(["main-db"]);
    expect(parsed.environments.dev?.limits).toEqual({ monthly: 150 });
  });

  // @covers sta-1640:FR-001
  it("refuses a reserved kind and an engine on a non-Postgres kind", () => {
    expect(pathsOf(root({ resources: { events: { kind: "kafka" } } }))).toContain(
      "resources.events.kind",
    );
    expect(
      pathsOf(
        root({
          resources: { "main-db": { kind: "postgres" }, jobs: { kind: "queue", engine: "rds" } },
        }),
      ),
    ).toContain("resources.jobs.engine");
  });

  // @covers sta-1640:FR-002
  it("refuses a workload without a reason, with a tagged image or with an inverted scale", () => {
    const zitadel = (root({}) as { workloads: { zitadel: Record<string, unknown> } }).workloads
      .zitadel;
    const { reason: _, ...unreasoned } = zitadel;

    expect(pathsOf(root({ workloads: { zitadel: unreasoned } }))).toContain(
      "workloads.zitadel.reason",
    );
    expect(
      pathsOf(
        root({ workloads: { zitadel: { ...zitadel, image: "ghcr.io/zitadel/zitadel:v4" } } }),
      ),
    ).toContain("workloads.zitadel.image");
    expect(
      pathsOf(
        root({ workloads: { zitadel: { ...zitadel, scale: { production: { min: 5, max: 2 } } } } }),
      ),
    ).toContain("workloads.zitadel.scale.production.min");
  });

  // @covers sta-1640:FR-002
  it("takes a workload's arguments and the names it reads resource variables under", () => {
    const zitadel = (root({}) as { workloads: { zitadel: Record<string, unknown> } }).workloads
      .zitadel;
    const command = ["start-from-init", "--masterkeyFromEnv", "--tlsMode", "external"];
    const aliases = { ZITADEL_DATABASE_POSTGRES_DSN: "MAIN_DB_URL" };

    const parsed = parseRunway(
      "root",
      root({ workloads: { zitadel: { ...zitadel, command, aliases } } }),
    );
    expect(parsed.workloads?.["zitadel"]).toMatchObject({ command, aliases });

    expect(pathsOf(root({ workloads: { zitadel: { ...zitadel, command: [] } } }))).toContain(
      "workloads.zitadel.command",
    );
    expect(
      pathsOf(
        root({ workloads: { zitadel: { ...zitadel, aliases: { dsn: "MAIN_DB_URL" } } } }),
      ).some((path) => path.startsWith("workloads.zitadel.aliases")),
    ).toBe(true);
  });

  it("takes an internal worker with no port, and refuses a public one or a health path without a port", () => {
    const zitadel = (root({}) as { workloads: { zitadel: Record<string, unknown> } }).workloads
      .zitadel;
    const { port: _port, health: _health, expose: _expose, ...worker } = zitadel;
    const healthCommand = ["pgrep", "-f", "sidekiq"];

    const parsed = parseRunway(
      "root",
      root({ workloads: { zitadel: { ...worker, healthCommand } } }),
    );
    expect(parsed.workloads?.["zitadel"]).toMatchObject({ healthCommand });
    expect(parsed.workloads?.["zitadel"]).not.toHaveProperty("port");

    const refused = pathsOf(root({ workloads: { zitadel: { ...worker, expose: "public" } } }));
    expect(refused).toEqual(
      expect.arrayContaining(["workloads.zitadel.port", "workloads.zitadel.health"]),
    );
    expect(pathsOf(root({ workloads: { zitadel: { ...worker, health: "/healthz" } } }))).toContain(
      "workloads.zitadel.health",
    );
  });

  it("takes a migrate command run before each rollout, and refuses an empty one or a timeout past an hour", () => {
    const zitadel = (root({}) as { workloads: { zitadel: Record<string, unknown> } }).workloads
      .zitadel;
    const migrate = { command: ["setup", "--masterkeyFromEnv"], timeoutMinutes: 20 };

    const parsed = parseRunway("root", root({ workloads: { zitadel: { ...zitadel, migrate } } }));
    expect(parsed.workloads?.["zitadel"]?.migrate).toEqual(migrate);

    expect(
      pathsOf(root({ workloads: { zitadel: { ...zitadel, migrate: { command: [] } } } })),
    ).toContain("workloads.zitadel.migrate.command");
    expect(
      pathsOf(
        root({
          workloads: { zitadel: { ...zitadel, migrate: { ...migrate, timeoutMinutes: 90 } } },
        }),
      ),
    ).toContain("workloads.zitadel.migrate.timeoutMinutes");
  });

  // @covers sta-1640:FR-003
  it("refuses a workload that uses a resource the runway does not declare", () => {
    expect(pathsOf(root({ resources: {} }))).toContain("workloads.zitadel.uses.0");
  });

  // @covers sta-1640:FR-003
  it("lets a service member name the resources it uses", () => {
    expect(
      parseRunway("service", { version: 3, uses: ["main-db"], environments: {} }).uses,
    ).toEqual(["main-db"]);
  });
});
