/**
 * Stackra file contract:
 * Purpose: `TamoTasks`, every task a Tamo slot runs, by name, with what it takes and what it gives back: text actions,
 *          continuing and drafting text, a filter and sort from words, a summary, a filled column or form, a date from
 *          words, and a question about the screen.
 * Boundary: types only; @stackra/ui never calls a model. Every output is a proposal the person previews and applies (ADR
 *           0021); none is applied by the slot.
 * Runtime: isomorphic
 * Governing contract: ADR 0507 (Ask Tamo: AI slots in the design system).
 */
import type { RuleCondition } from "#contracts/types/rule-condition.type";
import type { SortDescriptor } from "#contracts/types/sort-descriptor.type";
import type { TamoFieldHint } from "#contracts/types/tamo-field-hint.type";

/** The Tamo tasks: `input` is what a part sends, `output` what the AI module answers. */
export interface TamoTasks {
  /** A text action (a `TamoActionKind` or a contributed action's id) on the text; the new text. */
  readonly transform: {
    readonly input: {
      readonly text: string;
      readonly action: string;
      readonly locale: string;
      readonly field?: string | undefined;
    };
    readonly output: string;
  };
  /** What comes next after the text, shown as ghost text. */
  readonly continue: {
    readonly input: {
      readonly text: string;
      readonly locale: string;
      readonly field?: string | undefined;
    };
    readonly output: string;
  };
  /** A first draft of an empty field from the person's words. */
  readonly draft: {
    readonly input: {
      readonly prompt: string;
      readonly locale: string;
      readonly field?: string | undefined;
    };
    readonly output: string;
  };
  /** Words to filter and sort a collection: the conditions (ids `filter:<column>`) and the sort keys. */
  readonly filter: {
    readonly input: {
      readonly text: string;
      readonly locale: string;
      readonly columns: readonly TamoFieldHint[];
    };
    readonly output: {
      readonly conditions: readonly RuleCondition[];
      readonly sort: readonly SortDescriptor[];
    };
  };
  /** A short summary of rows, given as their shown text by column label. */
  readonly summarise: {
    readonly input: {
      readonly rows: readonly Readonly<Record<string, string>>[];
      readonly locale: string;
    };
    readonly output: string;
  };
  /** A value for one column on each row, by row id. */
  readonly fill_column: {
    readonly input: {
      readonly column: TamoFieldHint;
      readonly instruction: string;
      readonly rows: readonly {
        readonly id: string;
        readonly values: Readonly<Record<string, string>>;
      }[];
      readonly locale: string;
    };
    readonly output: Readonly<Record<string, string>>;
  };
  /** Form values from pasted text, by field name; a field the text does not give is left out. */
  readonly fill_form: {
    readonly input: {
      readonly text: string;
      readonly locale: string;
      readonly fields: readonly TamoFieldHint[];
    };
    readonly output: Readonly<Record<string, string>>;
  };
  /** A day (`start`) or a range (`start` and `end`), ISO calendar days, from words; `null` when none is meant. */
  readonly date: {
    readonly input: {
      readonly text: string;
      readonly locale: string;
      /** Today, as an ISO calendar day, so "next Friday" is counted from the person's day. */
      readonly today: string;
      readonly isRange: boolean;
    };
    readonly output: { readonly start: string; readonly end?: string | undefined } | null;
  };
  /** An answer to a question about the current screen. */
  readonly ask: {
    readonly input: { readonly question: string; readonly locale: string };
    readonly output: string;
  };
}
