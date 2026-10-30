/**
 * Stackra file contract:
 * Purpose: `TextRevealProps`, the props of the web `TextReveal` in `text-reveal.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3).
 */
import type { TextRevealContractProps } from "#contracts/types/text-reveal-contract-props.type";

/** Props of the web TextReveal: the shared contract. */
export type TextRevealProps = TextRevealContractProps;
