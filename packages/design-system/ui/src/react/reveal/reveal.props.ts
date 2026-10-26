/**
 * Stackra file contract:
 * Purpose: `RevealProps`, the props of the web `Reveal` in `reveal.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0329 (motion layer); ADR 0302 (decision
 *          3); ADR 0303 (decision 7).
 */
import type { HTMLMotionProps } from "motion/react";
import type { RevealContractProps } from "#contracts/types/reveal-contract-props.type";

/**
 * Props of the web Reveal: the shared contract plus Motion's `div` props, passed through. The motion itself
 * (`initial`, `animate`, `transition`) is the theme's, so those are refused.
 */
export type RevealProps = RevealContractProps &
  Omit<
    HTMLMotionProps<"div">,
    keyof RevealContractProps | "initial" | "animate" | "transition" | "exit"
  >;
