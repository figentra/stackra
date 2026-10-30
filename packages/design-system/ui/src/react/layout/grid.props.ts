/**
 * Stackra file contract:
 * Purpose: `GridProps`, the props of the web `Grid`: the shared contract plus every `div` prop.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371 (wave C).
 */
import type { ComponentPropsWithRef } from "react";

import type { GridContractProps } from "#contracts/types/grid-contract-props.type";

/** Props of the web Grid. */
export type GridProps = GridContractProps &
  Omit<ComponentPropsWithRef<"div">, keyof GridContractProps>;
