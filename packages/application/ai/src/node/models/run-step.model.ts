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
import { Int } from "@stackra/validation";

/** A step as a row. */
// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: merged with the [OptionalProps] augmentation below
export class RunStep extends Model.with(HasPublicId("aistep"), BelongsToTenant, AppendOnly) {
  /** The step's number in the run, from 0. */
  @Int
  index!: number;

  /** The input tokens it used. */
  @Int
  inputTokens!: number;

  /** The output tokens it used. */
  @Int
  outputTokens!: number;

  /** The run's public id. */
  runId!: string;

  /** Why the model stopped this step. */
  finishReason!: string;
}

/** The insert-optional fields of `RunStep`, merged into the model class (MikroORM `[OptionalProps]`). */
// shortcut: written by hand until gen writes the entity files (STA-339).
// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: the generated `[OptionalProps]` augmentation merges into the model, as gen's entity files do
export interface RunStep {
  /** The fields an insert may leave out: minted ids, trait-filled columns and defaulted fields. */
  [OptionalProps]?: "id" | "tenantId";
}
