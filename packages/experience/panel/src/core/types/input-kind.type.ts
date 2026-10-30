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
      /** Text, a number or a switch; `missing` when the schema has no such path (drawn as text). */
      readonly kind: "text" | "number" | "boolean" | "missing";
    }
  | {
      /** A choice of the enum's codes. */
      readonly kind: "enum";
      /** The codes, in the schema's order. */
      readonly options: readonly string[];
    }
  | {
      /** A nested object, drawn as a titled group of its keys. */
      readonly kind: "object";
      /** Its keys, in the schema's order. */
      readonly keys: readonly string[];
    }
  | {
      /** A list, drawn as rows to add and remove; each row is an object's group or one field. */
      readonly kind: "list";
      /** Whether an item is an object (a group per row) or a single value. */
      readonly item: "object" | "value";
    };
