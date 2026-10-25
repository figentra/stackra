/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./node` entry of @stackra/infra-observability until `stackra gen` writes the entry
 *          barrels (STA-339): the Pulumi programs of the telemetry stack (the whole stack in one call, and each part
 *          for a stack that composes its own).
 * Boundary: names each re-export and declares nothing. Pulumi runs under Node only, so these never reach `.`.
 * Runtime: node (Pulumi program)
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0171 (decisions 2 and 6).
 */
export { heartbeatMonitors } from "#node/functions/heartbeat-monitors.function";
export { logPipeline } from "#node/functions/log-pipeline.function";
export { observabilityStack } from "#node/functions/observability-stack.function";
export { sentryProjects } from "#node/functions/sentry-projects.function";
