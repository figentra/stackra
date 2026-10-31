/**
 * Stackra file contract:
 * Purpose: `RichTextEditorContractProps`, the props every runtime's `RichTextEditor` takes: a labelled document
 *          field whose value is ProseMirror JSON or HTML, with a placeholder, read-only and disabled states and a
 *          character count.
 * Boundary: types only. `value` and `defaultValue` take either form; `format` picks the form `onChange` reports.
 *           HTML is sanitised to the editor's schema on the way in (ADR 0466 decision 5).
 * Runtime: isomorphic
 * Governing contract: ADR 0466 (decisions 2, 7 and 8); ADR 0302 (decision 3); ADR 0055 (one field contract);
 *          STA-1371.
 */
import type { FieldContractProps } from "#contracts/types/field-contract-props.type";
import type { RichTextNode } from "#contracts/types/rich-text-node.type";

/** Props shared by the web and native `RichTextEditor`. */
export interface RichTextEditorContractProps extends FieldContractProps<RichTextNode | string> {
  /** The form `onChange` reports and a form submits: the document JSON (default) or its HTML. */
  readonly format?: "json" | "html" | undefined;
  /** Hint text inside the empty editor. */
  readonly placeholder?: string | undefined;
  /** The most characters the document may hold; typing past it is refused and the count shows it. */
  readonly characterLimit?: number | undefined;
  /** True to show the character count under the editor; it always shows when `characterLimit` is set. */
  readonly hasCharacterCount?: boolean | undefined;
}
