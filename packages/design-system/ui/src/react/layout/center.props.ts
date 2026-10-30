/**
 * Stackra file contract:
 * Purpose: `CenterProps`, the props of the web `Center`: the shared contract plus every `div` prop.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371 (wave C).
 */
import type { ComponentPropsWithRef } from "react";

import type { CenterContractProps } from "#contracts/types/center-contract-props.type";

/** Props of the web Center. */
export type CenterProps = CenterContractProps &
  Omit<ComponentPropsWithRef<"div">, keyof CenterContractProps>;
