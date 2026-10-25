/**
 * Stackra file contract:
 * Purpose: `WorkflowEngineOptions`, the shape of the workflow configuration: which journal the native engine keeps
 *          runs in.
 * Boundary: a shape class registered with its shipped schema, so `WorkflowConfig` builds without gen. Named for the
 *           engine, because `WorkflowOptions` is the kind's options type.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4 and 19); ADR 0146 as amended; ADR 0292 (decision 2).
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
}

registerSchemas([[WorkflowEngineOptions, WORKFLOW_CONFIG_SCHEMA]]);
