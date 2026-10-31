/**
 * Stackra file contract:
 * Purpose: `RichTextEditorProps`, the props of the web `RichTextEditor` in `rich-text-editor.tsx`.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0305 (one declaration per file); ADR 0466 (decision 3); STA-1371.
 */
import type { RichTextEditorContractProps } from "#contracts/types/rich-text-editor-contract-props.type";
import type { RichTextContribution } from "#react/rich-text-editor/rich-text-contribution.type";

/** Props of the web RichTextEditor: the shared contract, contributions, a class name and a name without a label. */
export type RichTextEditorProps = RichTextEditorContractProps & {
  /** Editor contributions; those whose `kinds` leave out `documentKind` are skipped. Keep their ids stable. */
  readonly contributions?: readonly RichTextContribution[] | undefined;
  /** The kind of document being edited, matched against each contribution's `kinds`. */
  readonly documentKind?: string | undefined;
  /** Styles the root. */
  readonly className?: string | undefined;
  /** The editor's name for assistive technology when it has no visible `label`. */
  readonly "aria-label"?: string | undefined;
};
