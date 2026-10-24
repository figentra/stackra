/**
 * Stackra file contract:
 * Purpose: the props every runtime's `ProgressCircle` takes: the shared progress props and nothing more, because a
 *          circle draws no text; its name and value are spoken only. Each runtime's `ProgressCircleProps` is this plus the
 *          runtime's own pass-through props.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0312; ADR 0165 (UI contract).
 */
import type { ProgressContractProps } from "#contracts/types/progress-contract-props.type";

/** Props shared by the web and native `ProgressCircle`. */
export type ProgressCircleContractProps = ProgressContractProps;
