/**
 * Stackra file contract:
 * Purpose: `GEN_REACHED_PORTS`, the ports gen binds in a service or app even when no constructor injects them: the
 *          action pipeline's own (`pipelinePorts`, `replicaReadsPorts`), the follow-the-system defaults
 *          (`systemDriverDefaults`) and every token of the server contributions (`SERVER_CONTRIBUTIONS`: the request
 *          guards' configs, the health drivers' ports and configs, the cache evictor's).
 * Boundary: a frozen list of class names. Discovery counts them as used, so a dependency imported only through its
 *           `./contracts` entry that drives one of them stays fully hosted and its driver table is written (STA-2584).
 *           Over-hosting is the safe side; a test keeps the pipeline and system names in step with their functions.
 * Runtime: isomorphic
 * Governing contract: ADR 0263 (gen writes the wiring); ADR 0294 (decision 15); STA-2567, STA-2573, STA-2584.
 */
import { SERVER_CONTRIBUTIONS } from "#core/constants/server-contributions.constant";

/** Class names of the ports gen reaches without injection. */
export const GEN_REACHED_PORTS: readonly string[] = Object.freeze([
  ...new Set([
    // pipelinePorts and replicaReadsPorts
    "EventOutbox",
    "IdempotencyStore",
    "DeviceSequenceStore",
    "OfflineCapStore",
    "ReviewItemSink",
    "StepUpCheck",
    "ReplicaReads",
    // systemDriverDefaults
    "SystemAccessibility",
    "SystemSettings",
    "SystemPermissions",
    "JsonWebKeys",
    ...SERVER_CONTRIBUTIONS.flatMap((contribution) => contribution.deps.map((dep) => dep.name)),
  ]),
]);
