/**
 * Stackra file contract:
 * Purpose: `RichTextEditorProps`, the props of the native `RichTextEditor` in `rich-text-editor.tsx`.
 * Boundary: types only; editor contributions are web-only (tentap runs its own bundled TipTap in the WebView).
 * Runtime: react-native
 * Governing contract: ADR 0305 (one declaration per file); ADR 0466; STA-1371.
 */
import type { RichTextEditorContractProps } from "#contracts/types/rich-text-editor-contract-props.type";

/** Props of the native RichTextEditor: the shared contract, a class name and the accessible name without a label. */
export type RichTextEditorProps = RichTextEditorContractProps & {
  /** Styles the root. */
  readonly className?: string | undefined;
  /** The field's name for assistive technology when it has no string `label`. */
  readonly accessibilityLabel?: string | undefined;
};
