/**
 * Stackra file contract:
 * Purpose: `AiMarkProps`, the props of the web `AiMark` in `ai-mark.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0360 (decision 11); ADR 0302 (decision
 *          3); WCAG 2.2 SC 1.1.1.
 */
import type { AiMarkContractProps } from "#contracts/types/ai-mark-contract-props.type";

/** Props of the web AiMark. */
export type AiMarkProps = AiMarkContractProps;
