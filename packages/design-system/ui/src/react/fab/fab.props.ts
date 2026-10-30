/**
 * Stackra file contract:
 * Purpose: `FabProps`, the props of the web `Fab` in `fab.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3).
 */
import type { ComponentPropsWithoutRef } from "react";
import type { FabContractProps } from "#contracts/types/fab-contract-props.type";

/** Props of the web Fab: the shared contract plus the root's own props, passed through. */
export type FabProps = FabContractProps &
  Omit<ComponentPropsWithoutRef<"div">, keyof FabContractProps>;
