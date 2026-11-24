/**
 * Stackra file contract:
 * Purpose: `PingOutput`, the output of `health.ping.check@1`: `up` once the pipeline has run every step to `handle`.
 * Boundary: a shape class in its own file; built with `PingOutput.create`, never `new`.
 * Runtime: node
 * Governing contract: ADR 0294 (as amended by programming model v3.1, AGENTS.md); ADR 0305 (one declaration per file).
 */
import type { HealthStatus } from "@stackra/contracts";
import { Schema } from "@stackra/validation";

/** The answer of a ping. */
export class PingOutput extends Schema {
  /** `up`: an unhealthy pipeline does not answer. */
  status!: HealthStatus;
}
