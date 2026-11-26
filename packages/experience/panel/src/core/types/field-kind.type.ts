/**
 * Stackra file contract:
 * Purpose: `FieldKind`, which control a form field draws from a JSON Schema input: every kind `InputKind` has, refined
 *          where JSON Schema says more: long text, several choices, money in minor units, a record reference by its
 *          public-id prefix, and an uploaded file.
 * Boundary: a type only; `fieldKindOf` gives it. A kind's `base` is the `InputKind` kind the same field has from its zod
 *           schema, so a screen and the chat draw a field the same way (the parity test pins it).
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (form keys are paths of the input); ADR 0055 (thin field adapters); Tamo spec generative-ui-tools-artifacts (G3)
 */
/** A form field's control. */
export type FieldKind =
  | {
      /** As `InputKind`: text, a switch, a calendar day, an instant, any JSON value, or `missing`. */
      readonly kind: "text" | "boolean" | "date" | "datetime" | "json" | "missing";
    }
  | {
      /** A number, with the schema's bounds when it has them. */
      readonly kind: "number";
      /** The smallest value allowed. */
      readonly min?: number;
      /** The largest value allowed. */
      readonly max?: number;
    }
  | {
      /** One of the codes (`enum`), or several of them (`multi_enum`, an array of an enum). */
      readonly kind: "enum" | "multi_enum";
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
      /** A list of rows; each row is an object's group or one field. */
      readonly kind: "list";
      /** Whether an item is an object or a single value. */
      readonly item: "object" | "value";
    }
  | {
      /** A map of string keys, drawn as key and value rows. */
      readonly kind: "record";
      /** Whether a value is a number or text. */
      readonly value: "number" | "text";
    }
  | {
      /**
       * Refinements of `text` or `number`: `longtext` (more than 500 characters), `money` (an integer `…Minor` field,
       * in the currency's minor units), `file` (an upload, `{ id: "upl_…" }`).
       */
      readonly kind: "longtext" | "money" | "file";
    }
  | {
      /** A record of another model, picked by its public id; `prefix` names the model (`ord`). */
      readonly kind: "reference";
      /** The public-id prefix. */
      readonly prefix: string;
    };
