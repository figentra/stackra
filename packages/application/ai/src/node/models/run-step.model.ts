/**
 * Stackra file contract:
 * Purpose: `RunStep`, one model step of a run: its number, why the model stopped, and the tokens it used.
 * Boundary: data only. Key `ai.run_step`, table `ai.steps`, public ids `aistep_…`, append-only, owned through
 *           `BelongsToTenant`. Counts and reasons only, never text.
 * Runtime: node
 * Governing contract: ADR 0100 (decisions 9 and 10: `ai_steps`); ADR 0399.
 */
import type { OptionalProps } from "@stackra/database";
import { AppendOnly, HasPublicId, Model } from "@stackra/model";
import { BelongsToTenant } from "@stackra/tenancy/node";

/** A step as a row. */
// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: merged with the [OptionalProps] augmentation below
export class RunStep extends Model.with(HasPublicId("aistep"), BelongsToTenant, AppendOnly) {
  /** The run's public id. */
  runId!: string;

  /** The step's number in the run, from 0. */
  index!: number;

  /** Why the model stopped this step. */
  finishReason!: string;

  /** The input tokens it used. */
  inputTokens!: number;

  /** The output tokens it used. */
  outputTokens!: number;
}

// shortcut: written by hand until gen writes the entity files (STA-339).
// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: the generated `[OptionalProps]` augmentation merges into the model, as gen's entity files do
export interface RunStep {
  [OptionalProps]?: "id" | "tenantId";
}
