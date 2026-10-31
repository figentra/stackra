/**
 * Stackra file contract:
 * Purpose: `WordCloudProps`, the props of the web `WordCloud`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (web); STA-1371.
 */
import type { WordCloudContractProps } from "#contracts/types/word-cloud-contract-props.type";

/** Props of the web WordCloud. */
export type WordCloudProps = WordCloudContractProps & {
  readonly className?: string | undefined;
};
