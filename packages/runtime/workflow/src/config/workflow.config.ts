/**
 * Stackra file contract:
 * Purpose: `WorkflowConfig`, the workflow configuration (key `workflow`): the `journal` runway sets per environment
 *          (`postgres` by default, `memory` for a test or a single process).
 * Boundary: a configuration class over `WorkflowEngineOptions` with no env map; runway's `config.workflow` layer sets
 *           it. A host overrides it as `class WorkflowConfig extends BaseWorkflowConfig` with `override` members only.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4, 19 and 20); ADR 0146 as amended; ADR 0296 (decision 1); ADR 0292
 *                     (decision 2).
 */
import { Config } from "@stackra/config";

import { WorkflowEngineOptions } from "#core/schemas/workflow-engine-options.schema";

/**
 * The workflow configuration.
 *
 * @example
 * // runway.yaml: environments.dev.config.workflow.journal: memory
 */
export class WorkflowConfig extends Config({ schema: WorkflowEngineOptions }) {}
