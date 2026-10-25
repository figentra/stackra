/**
 * Stackra file contract:
 * Purpose: `FieldNode`, one recorded form element: a field, an upload, a repeater, a grid of fields or a set of steps
 *          (a wizard on Create, tabs on Edit).
 * Boundary: a type only; built by `FormField.*`, `FormStep.of` and the form builder. A step is part of a steps node.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 11: forms); ADR 0294 (decision 23: "step" alone means a workflow step, so the form's are
 *                     `FormStep`).
 */
import type { AnyClass } from "@stackra/container";
import type { Enum } from "@stackra/contracts";

/** One form element. */
export type FieldNode =
  | {
      /** A field rendered from its type: a text, a number, a switch, an enum or a `T | null` object switch. */
      readonly kind: "value";
      /** The input path. */
      readonly key: string;
      /** The grid columns the field spans. */
      readonly span?: number;
      /** The enum whose codes the field offers; gen fills it from the input type. */
      readonly enum?: Enum.Any;
      /** The query whose rows the field picks ids from. */
      readonly options?: AnyClass;
      /** The row path the picker shows. */
      readonly optionLabel?: string;
    }
  | {
      /** A file upload through the bucket's signed URL, attached with an action. */
      readonly kind: "upload";
      /** The input path. */
      readonly key: string;
      /** The action that attaches the uploaded file. */
      readonly action: AnyClass;
      /** The accepted media types; gen fills them from the bucket. */
      readonly accept?: readonly string[];
      /** The largest file accepted; gen fills it from the bucket. */
      readonly maxBytes?: number;
    }
  | {
      /** A list of items, each a group of fields. */
      readonly kind: "repeater";
      /** The input path of the list. */
      readonly key: string;
      /** The fields of one item. */
      readonly fields: readonly FieldNode[];
    }
  | {
      /** Fields on a grid. */
      readonly kind: "grid";
      /** The number of columns. */
      readonly columns: number;
      /** The fields on it. */
      readonly fields: readonly FieldNode[];
    }
  | {
      /** A wizard on Create, the same steps as tabs on Edit. */
      readonly kind: "steps";
      /** The snake_case name of the set. */
      readonly name: string;
      /** The steps in order. */
      readonly steps: readonly {
        /** The snake_case step name; its label is derived. */
        readonly name: string;
        /** The fields of the step. */
        readonly fields: readonly FieldNode[];
      }[];
    };
