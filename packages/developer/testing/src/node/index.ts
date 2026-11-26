/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./node` entry of @stackra/testing, the load tier's kit (ADR 0182 decision 4):
 *          `serveLoadTarget` serves a subject's scenarios over loopback HTTP, `runK6` drives one with k6 and reads its
 *          summary, `k6Binary` finds k6 (a load test skips without it), `soakLoad` sizes a soak from the environment,
 *          `writeLoadReport` keeps the numbers, and `summariseLatencies` and `percentile` reduce run times. Until
 *          `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Node only (http, child_process, fs); no workspace import.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); ADR 0269 (decision 6 and owner decision 14: `./node` once something
 *                     imports it); ADR 0182 (decision 4); STA-317.
 */
export { k6Args } from "#node/k6/k6-args.function";
export { k6Binary } from "#node/k6/k6-binary.function";
export type { K6Load } from "#node/k6/k6-load.type";
export type { K6Result } from "#node/k6/k6-result.type";
export { K6_SCENARIO_SCRIPT } from "#node/k6/k6-scenario-script.constant";
export { readK6Summary } from "#node/k6/read-k6-summary.function";
export { runK6 } from "#node/k6/run-k6.function";
export type { RunK6Options } from "#node/k6/run-k6-options.type";
export type { LatencySummary } from "#node/latency/latency-summary.type";
export { percentile } from "#node/latency/percentile.function";
export { summariseLatencies } from "#node/latency/summarise-latencies.function";
export { writeLoadReport } from "#node/load-report/write-load-report.function";
export { soakLoad } from "#node/load-settings/soak-load.function";
export type { LoadScenarios } from "#node/load-target/load-scenarios.type";
export type { LoadTarget } from "#node/load-target/load-target.type";
export { serveLoadTarget } from "#node/load-target/serve-load-target.function";
