/**
 * Stackra file contract:
 * Purpose: `HoverCardProps`, the props of the native `HoverCard`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303; STA-1371.
 */
import type { HoverCardContractProps } from "#contracts/types/hover-card-contract-props.type";

/** Props of the native HoverCard. */
export type HoverCardProps = HoverCardContractProps & {
  readonly className?: string | undefined;
};
