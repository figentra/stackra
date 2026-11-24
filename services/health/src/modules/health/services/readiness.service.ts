/**
 * Stackra file contract:
 * Purpose: `ReadinessService`, the answer of `GET /readyz`: runs every `HealthIndicator` the container binds and this
 *          service's own checks (migrations, pipeline), each capped at `PROBE_TIMEOUT_MS`, and answers 200 when none is `down` and 503 otherwise, with each indicator's
 *          status by name.
 * Boundary: the contract of `@stackra/app`'s own readiness answer: an indicator that throws or runs past the cap is
 *           `down`, `degraded` still serves, and an indicator's detail never leaves (a status per name only). It
 *           resolves the indicators on each call, so a binding added after boot is checked.
 * Runtime: node
 * Governing contract: ADR 0190 (health); ADR 0457 (multi-binding: `getAll`); registry gap R-27.
 */
import { Service } from "@stackra/container";
import type { DiscoveryService } from "@stackra/container";
import { HealthIndicator, HealthStatus } from "@stackra/contracts";

import { PROBE_TIMEOUT_MS } from "#modules/health/constants/probe-timeout.constant";
import type { MigrationsCheckService } from "#modules/health/services/migrations-check.service";
import type { PipelineCheckService } from "#modules/health/services/pipeline-check.service";
import type { ReadinessAnswer } from "#modules/health/types/readiness-answer.type";
import type { ReadinessCheck } from "#modules/health/types/readiness-check.type";

/** One indicator's status: `down` when it throws or runs past the cap. */
async function statusOf(indicator: ReadinessCheck): Promise<HealthStatus> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const late = new Promise<HealthStatus>((resolve) => {
    timer = setTimeout(() => resolve(HealthStatus.Down), PROBE_TIMEOUT_MS);
  });
  try {
    return await Promise.race([indicator.check().then((report) => report.status), late]);
  } catch {
    return HealthStatus.Down;
  } finally {
    clearTimeout(timer);
  }
}

/** Whether this process can serve. */
export class ReadinessService extends Service {
  private readonly discovery: DiscoveryService;

  private readonly own: readonly ReadinessCheck[];

  /**
   * @param discovery - reads the `HealthIndicator` bindings (the extension point), which are run.
   * @param migrations - whether the database is migrated.
   * @param pipeline - whether the actions pipeline answers.
   */
  constructor(
    discovery: DiscoveryService,
    migrations: MigrationsCheckService,
    pipeline: PipelineCheckService,
  ) {
    super();
    this.discovery = discovery;
    this.own = [migrations, pipeline];
  }

  /** Runs every indicator now. */
  async check(): Promise<ReadinessAnswer> {
    const indicators: readonly ReadinessCheck[] = [
      ...this.discovery.getAll(HealthIndicator),
      ...this.own,
    ];
    const entries = await Promise.all(
      indicators.map(async (indicator) => [indicator.name, await statusOf(indicator)] as const),
    );
    const ready = !entries.some(([, status]) => status === HealthStatus.Down);
    return { status: ready ? 200 : 503, body: Object.fromEntries(entries) };
  }
}
