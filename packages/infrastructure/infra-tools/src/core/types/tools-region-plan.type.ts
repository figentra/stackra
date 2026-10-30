/**
 * Stackra file contract:
 * Purpose: `ToolsRegionPlan`, one region's tools stack: the region's cloud, location and account, its network, its
 *          private namespace, how long its logs are kept, its tools, its Valkey, the tools' databases on the shared
 *          Postgres server with the admin login parameters, and the role Infisical's sync assumes.
 * Boundary: type only; plain data.
 * Runtime: isomorphic
 * Governing contract: owner decision R3-5 (2026-10-26); ADR 0444; ADR 0354 (decision 4: regions); ADR 0238; ADR 0173.
 */
import type { ToolDatabase } from "#core/types/tool-database.type";
import type { ToolPlan } from "#core/types/tool-plan.type";
import type { ToolsNetwork } from "#core/types/tools-network.type";

/** One region's stack. */
export type ToolsRegionPlan = {
  /** The root runway region key. */
  readonly key: string;
  /** `aws` or `gcp`. */
  readonly cloud: string;
  /** The cloud region (`me-central-1`). */
  readonly location: string;
  /** The account, an id or `ref:<path>`, when the runway names one. */
  readonly account?: string;
  /** The network the tools run in, when the runway names one. */
  readonly network?: ToolsNetwork;
  /** The private namespace, `<region>.tools.<project>.internal`. */
  readonly namespace: string;
  /** How many days the region's tool logs are kept. */
  readonly logRetentionDays: number;
  /**
   * Estimated dollars per hour of this region's GPU tools all awake at their maximum replicas. shortcut: the runway cost
   * cap (STA-1640, ADR 0493, not landed) will count it as `tools.<tool>` at `hourlyUsd` x 730 x max replicas in
   * STA-1662, after STA-1640 lands; nothing reads it yet.
   */
  readonly gpuHourlyUsdAtMax: number;
  /** The tools this region runs. */
  readonly tools: readonly ToolPlan[];
  /** The region's Valkey, present when a tool reads a cache URL. */
  readonly cache?: { readonly nodeType: string };
  /** The tools' databases on the shared Postgres server, created by the stack's one-shot database task. */
  readonly databases: readonly ToolDatabase[];
  /** The parameters holding the shared server's admin login (`PGHOST`, `PGUSER`, `PGPASSWORD`), when any database. */
  readonly databaseAdmin: readonly { readonly name: string; readonly parameter: string }[];
  /** The role Infisical assumes to write this region's parameters, when the runway names it. */
  readonly secretsSync?: { readonly principal: string; readonly externalId: string };
};
