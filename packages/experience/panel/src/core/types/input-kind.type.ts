/**
 * Stackra file contract:
 * Purpose: `InputKind`, which control a form field draws: text, a number, a switch, or a choice of an enum's codes.
 * Boundary: a type only; `inputKind` answers it from the input schema.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (form keys are paths of the create or update input).
 */

/** The control kind of one form field. */
export type InputKind =
  | {
      /** Text, a number or a switch. */
      readonly kind: "text" | "number" | "boolean";
    }
  | {
      /** A choice of the enum's codes. */
      readonly kind: "enum";
      /** The codes, in the schema's order. */
      readonly options: readonly string[];
    };
