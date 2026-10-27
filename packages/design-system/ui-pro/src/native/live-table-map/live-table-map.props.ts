/**
 * Stackra file contract:
 * Purpose: `LiveTableMapProps`, props of the native LiveTableMap.
 * Boundary: a type only.
 * Runtime: react-native
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3).
 */
import type { LiveTableMapContractProps } from "#contracts/types/live-table-map-contract-props.type";

/** Props of the native LiveTableMap. */
export type LiveTableMapProps = LiveTableMapContractProps;
