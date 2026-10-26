/**
 * Stackra file contract:
 * Purpose: `WorkflowEngineOptions`, the shape of the workflow configuration: which journal the native engine keeps
 *          runs in, and how long a signal or awaited event no run took is held before it is dropped.
 * Boundary: a shape class registered with its shipped schema, so `WorkflowConfig` builds without gen. Named for the
 *           engine, because `WorkflowOptions` is the kind's options type.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4 and 19); ADR 0146 as amended; ADR 0292 (decision 2); ADR 0427 (decision 2:
 *                     signal retention is configuration).
 */
import "#core/types/workflow-journal-names.type";

import type { DriverName } from "@stackra/container";
import { registerSchemas, Schema } from "@stackra/validation";

import { WORKFLOW_CONFIG_SCHEMA } from "#core/constants/workflow-config-schema.constant";
import type { WorkflowJournal } from "#core/ports/workflow-journal.port";

/** The workflow engine's options. */
export class WorkflowEngineOptions extends Schema {
  /** Which journal keeps runs: `postgres`, durable in the service's database; `memory`, in the process. */
  journal: DriverName<WorkflowJournal> = "postgres";

  /** How long an untaken signal or held event is kept (`"7d"`), from 1 minute to 90 days. */
  signalRetention: string = "7d";
}

registerSchemas([[WorkflowEngineOptions, WORKFLOW_CONFIG_SCHEMA]]);
