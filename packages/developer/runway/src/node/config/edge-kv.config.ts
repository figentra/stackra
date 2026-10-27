/**
 * Stackra file contract:
 * Purpose: `EdgeKvConfig`, the configuration `WranglerEdgeKvDriver` takes by constructor type: the namespace id of
 *          the edge KV copy.
 * Boundary: declares the class and registers its schema; values come from the deploy workflow (`buildConfig`).
 * Runtime: node
 * Governing contract: ADR 0437 (the KV copy); ADR 0296 (configuration, not code); runway AGENTS.md (a driver takes a
 *                     config class, never an options object).
 */
import { Config } from "@stackra/config";
import { registerSchemas } from "@stackra/validation";

import { EdgeKvConfig$ } from "#node/constants/edge-kv-config-schema.constant";
import { EdgeKvOptions } from "#node/schemas/edge-kv-options.schema";

// shortcut: registered here until gen writes the package's #stackra/schemas registration (registry gap G1, STA-339).
registerSchemas([[EdgeKvOptions, EdgeKvConfig$]]);

/**
 * The edge KV namespace Runway writes.
 *
 * @example
 * const kv = new WranglerEdgeKvDriver(buildConfig(EdgeKvConfig, { values: { namespaceId } }));
 */
export class EdgeKvConfig extends Config({ schema: EdgeKvOptions }) {}
