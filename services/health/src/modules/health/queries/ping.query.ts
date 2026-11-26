/**
 * Stackra file contract:
 * Purpose: `PingQuery`, `health.ping.check@1`: answers `up`. Only the platform itself calls it (the pipeline indicator of
 *          `/readyz`), so it has no endpoint and is no MCP tool (`endpoint: false`, `tool: false`).
 * Boundary: read only, touches no table; it exists to be run through every step of the actions pipeline (tenancy,
 *           permission, validation, `handle`), so a pipeline that cannot run a query is reported `down`. Its permission is
 *           derived from the key, and the platform actor (`system`) is the only actor kind it admits.
 * Runtime: node
 * Governing contract: ADR 0098 (actions are the unit; actor kinds); ADR 0190 (health); ADR 0294 (as amended by
 *                     programming model v3.1, AGENTS.md).
 */
import { Query, type QueryContext } from "@stackra/actions";
import { ActorKind, HealthStatus } from "@stackra/contracts";

import type { PingInput } from "#modules/health/schemas/ping-input.schema";
import { PingOutput } from "#modules/health/schemas/ping-output.schema";

/** Runs the pipeline end to end and answers `up`. */
export class PingQuery extends Query({
  key: "ping.check",
  tool: false,
  endpoint: false,
  actors: [ActorKind.System],
}) {
  /** Answers `up`. */
  async handle(_input: PingInput, _ctx: QueryContext): Promise<PingOutput> {
    return PingOutput.create({ status: HealthStatus.Up });
  }
}
