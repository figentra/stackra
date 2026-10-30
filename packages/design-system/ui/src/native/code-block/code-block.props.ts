/**
 * Stackra file contract:
 * Purpose: `CodeBlockProps`, the props of the native `CodeBlock`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303; STA-1371.
 */
import type { CodeBlockContractProps } from "#contracts/types/code-block-contract-props.type";

/** Props of the native CodeBlock. */
export type CodeBlockProps = CodeBlockContractProps & {
  readonly className?: string | undefined;
};
