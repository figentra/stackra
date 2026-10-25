/**
 * Stackra file contract:
 * Purpose: `Run<W>`, one run of workflow `W` as a step, an undo and `output` see it: its id, its input and the results
 *          of the steps done so far, inherited steps included.
 * Boundary: a type only. `input` and `results` are conditionals on the naked `W`, so inside a class `Run<this>`
 *           resolves through the class (a mapped type over `this` stays opaque and fails on property access, STA-335
 *           spike). The engine builds it from the journal, so a resumed run sees exactly what a fresh one saw.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 18: `Run<W>` tests the bare `W`); ADR 0102 (decision 5: typed inputs and
 *                     outputs).
 */
import type { PublicId } from "@stackra/contracts";

import type { ResultsOf } from "#core/types/results-of.type";

/**
 * One run of `W`.
 *
 * @example
 * async debit(run: Run<this>, ctx: StepContext): Promise<number> {
 *   const { memberId, points } = run.results.quote;
 *   return this.loyalty.redeem(memberId, points, run.input.reference, ctx.now());
 * }
 */
export interface Run<W> {
  /** The run's id, which the journal and every step's `stepKey` carry. */
  readonly id: PublicId<"wfr">;

  /** The input the run started with. */
  readonly input: W extends { readonly "~input": infer I } ? I : never;

  /** The result of each step done so far, by step name. */
  readonly results: W extends object ? ResultsOf<W> : never;
}
