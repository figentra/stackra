/**
 * Stackra file contract:
 * Purpose: `WorkflowClass<I>`, what `Workflow({ ... })` returns: the base class a workflow extends, whose instance
 *          carries its input type for `Run<W>`.
 * Boundary: a type only, exported by name so a consumer's declaration emit can name its base (ADR 0294 decision 25).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 25: each factory returns an exported, named class type).
 */
import type { WorkflowBase } from "#core/bases/workflow.base";

/** The base class of one workflow with input `I`. */
export type WorkflowClass<I> = abstract new () => WorkflowBase<I>;
