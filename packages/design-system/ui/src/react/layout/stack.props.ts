/**
 * Stackra file contract:
 * Purpose: `StackProps`, the props of the web `Stack`: the shared contract plus every `div` prop.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371 (wave C).
 */
import type { ComponentPropsWithRef } from "react";

import type { StackContractProps } from "#contracts/types/stack-contract-props.type";

/** Props of the web Stack. */
export type StackProps = StackContractProps &
  Omit<ComponentPropsWithRef<"div">, keyof StackContractProps>;
