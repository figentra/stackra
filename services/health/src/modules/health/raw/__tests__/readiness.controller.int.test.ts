/**
 * Stackra file contract:
 * Purpose: `GET /readyz` end to end on a real Postgres: the real `ReadinessController` answers a real Fetch `Request` over the
 *          real `ReadinessService`, the database package's own `DatabaseHealthIndicatorDriver` (found the way the container
 *          finds it, as a `HealthIndicator`), this service's migrations check and its pipeline check. Ready (200, every check
 *          `up`) after the member's migrations ran; not ready (503, naming the failed check and nothing of its detail) when the
 *          migration ledger is dirty, when the pipeline refuses, and when the database stops answering; ready again
 *          when the ledger is put back.
 * Boundary: integration tier (`.int`, `stackra test --tier int`, Docker). The migrations are the compiled files gen writes for
 *           this member, applied by the same runner `stackra db migrate` calls. Row-level role probing is off
 *           (`rowSecurity: false`), as the test connects as the container's superuser. The pipeline check runs the real
 *           `ActionPipeline` over the service's testing module.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0182 (test tiers); ADR 0190 (health); registry gap R-27.
 */
import { fileURLToPath } from "node:url";

import type { Container, DiscoveryService } from "@stackra/container";
import { createTestingModule } from "@stackra/container/testing";
import { Duration, HealthIndicator } from "@stackra/contracts";
import { DatabaseConfig } from "@stackra/database";
import type { Database } from "@stackra/database";
import { DatabaseHealthIndicatorDriver, migrate } from "@stackra/database/node";
import { usePostgres } from "@stackra/database/testing";
import { afterAll, beforeAll, describe, expect, it } from "@stackra/testing";

import { ReadinessController } from "#modules/health/raw/readiness.controller";
import { MigrationsCheckService } from "#modules/health/services/migrations-check.service";
import { PipelineCheckService } from "#modules/health/services/pipeline-check.service";
import { ReadinessService } from "#modules/health/services/readiness.service";
import { HealthModule } from "#stackra/module";

/** The member's folder, where `.stackra/migrations` lives. */
const memberRoot = fileURLToPath(new URL("../../../../../", import.meta.url));

// An empty migration list: the container starts bare and the real runner applies the compiled files.
const postgres = usePostgres({ migrations: [] });

/** Runs `sql` as the container's user. */
const run = (sql: string) => postgres.database.em().execute(sql);

/** The probe's answer to one GET of `/readyz`. */
async function readyz(
  controller: ReadinessController,
): Promise<{ status: number; body: Record<string, string> }> {
  const response = await controller.handle(new Request("http://service.test/readyz"));
  return { status: response.status, body: (await response.json()) as Record<string, string> };
}

describe(ReadinessController, () => {
  let controller: ReadinessController;
  let app: Awaited<ReturnType<ReturnType<typeof createTestingModule>["compile"]>>;
  let pipelineWorks = true;
  let databaseDown = false;

  beforeAll(async () => {
    process.env["DATABASE_DIRECT_URL"] = postgres.url;
    await migrate({ cwd: memberRoot, environment: "dev" });
    app = await createTestingModule(HealthModule).useDrivers("memory").compile();
    // The real database, until a test makes it refuse every connection with an error whose text must never leave.
    const database = {
      em: () => {
        if (databaseDown)
          throw new Error("connect ECONNREFUSED postgres://admin:hunter2@db.internal:5432");
        return postgres.database.em();
      },
    } as unknown as Database;
    const config = Object.assign(new DatabaseConfig(), {
      health: { timeout: Duration.seconds(2), critical: true, rowSecurity: false },
    });
    const indicators: HealthIndicator[] = [new DatabaseHealthIndicatorDriver(database, config)];
    // What the container's `getAll(HealthIndicator)` answers: the bound indicators of the packages.
    const discovery = {
      getAll: (base: unknown) => (base === HealthIndicator ? indicators : []),
    } as unknown as DiscoveryService;
    // The pipeline check runs in a request container; `pipelineWorks` lets a test make it refuse.
    const container = {
      forRequest: () => {
        if (!pipelineWorks) throw new Error("pipeline refused");
        return app;
      },
    } as unknown as Container;
    controller = new ReadinessController(
      new ReadinessService(
        discovery,
        new MigrationsCheckService(database),
        new PipelineCheckService(container),
      ),
    );
  }, 180_000);

  afterAll(async () => {
    await app?.close();
  });

  /** Everything works: 200 and every check by name. */
  it("answers 200 with every check up after the migrations ran", async () => {
    expect(await readyz(controller)).toEqual({
      status: 200,
      body: { database: "up", migrations: "up", pipeline: "up" },
    });
  });

  /** A dirty ledger makes the service not ready, and the body names the check, nothing more. */
  it("answers 503 naming migrations when the ledger is dirty, then 200 once it is put back", async () => {
    await run("update schema_migrations set dirty = true");
    try {
      const answer = await readyz(controller);
      expect(answer.status).toBe(503);
      expect(answer.body).toEqual({ database: "up", migrations: "down", pipeline: "up" });
      expect(JSON.stringify(answer)).not.toMatch(/dirty|version|schema_migrations/);
    } finally {
      await run("update schema_migrations set dirty = false");
    }
    expect((await readyz(controller)).status).toBe(200);
  });

  /** A pipeline that cannot run a call makes the service not ready. */
  it("answers 503 naming pipeline when the pipeline refuses", async () => {
    pipelineWorks = false;
    try {
      const answer = await readyz(controller);
      expect(answer).toEqual({
        status: 503,
        body: { database: "up", migrations: "up", pipeline: "down" },
      });
    } finally {
      pipelineWorks = true;
    }
    expect((await readyz(controller)).status).toBe(200);
  });

  /** A database that stops answering is the readiness probe's whole reason: not ready, and the answer still arrives. */
  it("answers 503 with database and migrations down once the database stops answering", async () => {
    databaseDown = true;
    try {
      const answer = await readyz(controller);
      expect(answer.status).toBe(503);
      expect(answer.body["database"]).toBe("down");
      expect(answer.body["migrations"]).toBe("down");
      expect(JSON.stringify(answer)).not.toMatch(/ECONN|hunter2|admin|postgres:\/\//i);
    } finally {
      databaseDown = false;
    }
    expect((await readyz(controller)).status).toBe(200);
  });
});
