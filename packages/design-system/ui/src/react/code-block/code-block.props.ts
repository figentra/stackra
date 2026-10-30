/**
 * Stackra file contract:
 * Purpose: `CodeBlockProps`, the props of the web `CodeBlock`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); STA-1371.
 */
import type { CodeBlockContractProps } from "#contracts/types/code-block-contract-props.type";

/** Props of the web CodeBlock. */
export type CodeBlockProps = CodeBlockContractProps & {
  readonly className?: string | undefined;
};
