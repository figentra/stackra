/**
 * Stackra file contract:
 * Purpose: the web `CodeBlock` compound on HeroUI Pro's CodeBlock: a highlighted code panel with the parts Header,
 *          Code and CopyButton; the copy button is named by `label`, the rest are HeroUI Pro's own.
 * Boundary: no styling or behaviour of its own; the look needs `@heroui-pro/react/css`. HeroUI Pro highlights with
 *          `shiki`, which loads its grammars asynchronously, so the code is drawn plain first and highlighted when
 *          they arrive. The compound exposes the documented parts: HeroUI Pro's `CodeBlock.Root` is left out.
 *          HeroUI Pro ships this component on its `code-block` subpath only, so the wrapper imports it from there.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-002.
 */
import {
  CodeBlock as HeroCodeBlock,
  type CodeBlockCopyButtonProps as HeroCodeBlockCopyButtonProps,
  type CodeBlockProps as HeroCodeBlockProps,
} from "@heroui-pro/react/code-block";

import type {
  CodeBlockContractProps,
  CodeBlockCopyButtonContractProps,
} from "#contracts/types/code-block-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";

/** Props of the web CodeBlock: the shared contract plus HeroUI Pro's own div props, passed through. */
export type CodeBlockProps = CodeBlockContractProps &
  Omit<HeroCodeBlockProps, keyof CodeBlockContractProps>;

/** Props of the copy button: the shared contract plus HeroUI Pro's own, with `aria-label` as `label`. */
export type CodeBlockCopyButtonProps = CodeBlockCopyButtonContractProps &
  Omit<HeroCodeBlockCopyButtonProps, keyof CodeBlockCopyButtonContractProps | "aria-label">;

/** The panel root: HeroUI Pro's. */
function CodeBlockRoot(props: CodeBlockProps) {
  return <HeroCodeBlock.Root {...props} />;
}

/** The icon-only button that copies `code` to the clipboard: HeroUI Pro's, named by `label`. */
function CodeBlockCopyButton({ label, ...rest }: CodeBlockCopyButtonProps) {
  return <HeroCodeBlock.CopyButton {...rest} {...omitUndefined({ "aria-label": label })} />;
}

/** The parts of the compound, typed from HeroUI Pro's own so the declaration output can name them. */
interface CodeBlockParts {
  /** The bar above the code, for a file name and the copy button. */
  readonly Header: typeof HeroCodeBlock.Header;
  /** The highlighted code, from `code` and `language`. */
  readonly Code: typeof HeroCodeBlock.Code;
  /** The button that copies the code, named by `label`. */
  readonly CopyButton: typeof CodeBlockCopyButton;
}

/** A code panel: `CodeBlock.Header` with `CopyButton`, then `CodeBlock.Code`. */
export const CodeBlock: typeof CodeBlockRoot & CodeBlockParts = Object.assign(CodeBlockRoot, {
  Header: HeroCodeBlock.Header,
  Code: HeroCodeBlock.Code,
  CopyButton: CodeBlockCopyButton,
});
