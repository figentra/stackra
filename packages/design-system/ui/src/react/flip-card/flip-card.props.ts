/**
 * Stackra file contract:
 * Purpose: `FlipCardProps`, the props of the web `FlipCard` in `flip-card.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3).
 */
import type { ComponentPropsWithoutRef } from "react";
import type { FlipCardContractProps } from "#contracts/types/flip-card-contract-props.type";

/** Props of the web FlipCard: the shared contract plus the root's own props, passed through. */
export type FlipCardProps = FlipCardContractProps &
  Omit<
    ComponentPropsWithoutRef<"div">,
    keyof FlipCardContractProps | "children" | "onClick" | "onKeyDown"
  >;
