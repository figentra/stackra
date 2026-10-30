/**
 * Stackra file contract:
 * Purpose: `NumberPadProps`, the props of the web `NumberPad` in `number-pad.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3).
 */
import type { ComponentPropsWithoutRef } from "react";
import type { NumberPadContractProps } from "#contracts/types/number-pad-contract-props.type";

/** Props of the web NumberPad: the shared contract plus the root's own props, passed through. */
export type NumberPadProps = NumberPadContractProps &
  Omit<
    ComponentPropsWithoutRef<"div">,
    keyof NumberPadContractProps | "children" | "onChange" | "defaultValue"
  >;
