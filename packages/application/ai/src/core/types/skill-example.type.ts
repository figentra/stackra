/**
 * Stackra file contract:
 * Purpose: `SkillExample`, one few-shot example of a skill: what a person asks and the tool calls that answer it.
 * Boundary: a type only, the element type of a skill's `examples` field. A call names its tool by class, so renaming
 *           or removing the action breaks the build; an input value may be a reference into an earlier call's output
 *           (`"$0.items[0].id"`), so inputs are not typed against the tool's input schema.
 * Runtime: isomorphic
 * Governing contract: ADR 0245 (decision 5: instructions, tools, examples and knowledge).
 */
import type { Action, Query } from "@stackra/actions";
import type { AnyClass } from "@stackra/container";

/** One few-shot example of a skill. */
export interface SkillExample {
  /** What the person says. */
  readonly input: string;

  /** The tool calls that answer it, in order; `$<n>` in an input refers to the output of call `n`. */
  readonly calls: readonly {
    /** The action or query class called. */
    readonly tool: AnyClass<Action | Query>;
    /** The call's input. */
    readonly input: Readonly<Record<string, unknown>>;
  }[];
}
