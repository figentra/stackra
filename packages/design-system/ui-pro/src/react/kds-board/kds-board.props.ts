/**
 * Stackra file contract:
 * Purpose: `KdsBoardProps`, props of the web KdsBoard.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3).
 */
import type { KdsBoardContractProps } from "#contracts/types/kds-board-contract-props.type";

/** Props of the web KdsBoard. */
export type KdsBoardProps = KdsBoardContractProps;
