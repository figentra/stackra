/**
 * Stackra file contract:
 * Purpose: `SaveBarProps`, the props of the web `SaveBar` in `save-bar.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); design-system gap
 *          inventory row 8.
 */
import type { ComponentPropsWithoutRef } from "react";
import type { SaveBarContractProps } from "#contracts/types/save-bar-contract-props.type";

/** Props of the web SaveBar: the shared contract plus the props of its outer `div`, passed through unchanged. */
export type SaveBarProps = SaveBarContractProps &
  Omit<ComponentPropsWithoutRef<"div">, keyof SaveBarContractProps>;
