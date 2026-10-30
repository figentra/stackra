/**
 * Stackra file contract:
 * Purpose: `FlipCardProps`, the props of the native `FlipCard` in `flip-card.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3).
 */
import type { ViewProps } from "react-native";
import type { FlipCardContractProps } from "#contracts/types/flip-card-contract-props.type";

/** Props of the native FlipCard: the shared contract plus the root's own props, passed through. */
export type FlipCardProps = FlipCardContractProps & Omit<ViewProps, keyof FlipCardContractProps>;
