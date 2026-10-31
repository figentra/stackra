/**
 * Stackra file contract:
 * Purpose: `WordCloudProps`, the props of the native `WordCloud`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); STA-1371.
 */
import type { WordCloudContractProps } from "#contracts/types/word-cloud-contract-props.type";

/** Props of the native WordCloud. */
export type WordCloudProps = WordCloudContractProps & {
  readonly className?: string | undefined;
};
