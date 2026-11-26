/**
 * Stackra file contract:
 * Purpose: `PipelineCheckService`, a readiness check (`pipeline`) beside the bound `HealthIndicators`: `up` when a
 *          query runs through every step of the actions pipeline as the platform actor and answers `up`.
 * Boundary: runs `health.ping.check` in a request container with `ActionPipeline`, so tenancy, the access-control decision
 *           and input validation all run, and `down` when any of them refuses or throws (no `AccessControl` bound,
 *           for one). The query touches no table and the call carries no scope. A failure reports the error's name,
 *           never its message, and never throws.
 * Runtime: node
 * Governing contract: ADR 0098 (actions are the unit); ADR 0190 (health); ADR 0294 (decisions 16 and 17).
 */
import { ActionPipeline } from "@stackra/actions";
import { Service } from "@stackra/container";
import type { Container } from "@stackra/container";
import { ActorKind, Duration, HealthStatus } from "@stackra/contracts";
import type { Actor, HealthReport } from "@stackra/contracts";

import { HEALTH_ACTOR_ID } from "#modules/health/constants/health-actor-id.constant";
import { PingQuery } from "#modules/health/queries/ping.query";
import { PingInput } from "#modules/health/schemas/ping-input.schema";
import type { ReadinessCheck } from "#modules/health/types/readiness-check.type";

/** The platform itself, as the pipeline sees the probe. */
const ACTOR: Actor = Object.freeze({ kind: ActorKind.System, id: HEALTH_ACTOR_ID });

/** Whether the actions pipeline answers a call. */
export class PipelineCheckService extends Service implements ReadinessCheck {
  /** The dependency this check reports on. */
  readonly name = "pipeline";

  private readonly container: Container;

  /**
   * @param container - the booted container; each probe runs in a request container of its own.
   */
  constructor(container: Container) {
    super();
    this.container = container;
  }

  /** Runs `health.ping.check` through the pipeline. */
  async check(): Promise<HealthReport> {
    const started = Date.now();
    try {
      const output = await new ActionPipeline(this.container.forRequest()).execute(
        PingQuery,
        PingInput.create({}),
        { actor: ACTOR },
      );
      if (output.status !== HealthStatus.Up)
        return { status: HealthStatus.Down, detail: "the ping did not answer up" };
      return { status: HealthStatus.Up, latency: Duration.seconds((Date.now() - started) / 1000) };
    } catch (error) {
      return {
        status: HealthStatus.Down,
        detail: `the pipeline did not answer (${(error as Error).name})`,
      };
    }
  }
}
