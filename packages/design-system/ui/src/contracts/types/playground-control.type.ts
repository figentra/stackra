/**
 * Stackra file contract:
 * Purpose: `PlaygroundControl`, one prop a `PropsPlayground` lets people change: its name, the input it takes, its
 *          options and its starting value.
 * Boundary: types only. The docs build the list from the showcase registry's API record of the component.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-2041.
 */

/** One control of a props playground. */
export interface PlaygroundControl {
  /** The prop's name, shown as written in code and never translated. */
  readonly name: string;
  /** The input: a text field, a switch, a choice of `options` or a number field. */
  readonly type: "string" | "boolean" | "enum" | "number";
  /** The choices of an `enum` control. */
  readonly options?: readonly string[] | undefined;
  /** The starting value; without it a text is empty, a switch off, a number 0 and a choice its first option. */
  readonly default?: string | boolean | number | undefined;
}
