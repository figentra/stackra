/**
 * Stackra file contract:
 * Purpose: `RevealProps`, the props of the native `Reveal` in `reveal.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0329 (motion layer); ADR 0302 (decision
 *          3); ADR 0303 (decision 7).
 */
import type { ViewProps } from "react-native";
import type { RevealContractProps } from "#contracts/types/reveal-contract-props.type";

/**
 * Props of the native Reveal: the shared contract plus React Native's view props, passed through. The entrance is
 * the theme's, so Reanimated's `entering` and `exiting` are refused.
 */
export type RevealProps = RevealContractProps &
  Omit<ViewProps, keyof RevealContractProps | "entering" | "exiting">;
