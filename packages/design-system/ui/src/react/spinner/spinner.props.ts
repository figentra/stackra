/**
 * Stackra file contract:
 * Purpose: `SpinnerProps`, the props of the web `Spinner` in `spinner.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0303 (decision
 *          6, the loaders' exception of 2026-11-02; decision 7); ADR 0304.
 */
import type { ComponentPropsWithRef } from "react";
import type { SpinnerContractProps } from "#contracts/types/spinner-contract-props.type";

/** The shared contract plus the span's own props; the name and the hiding are the contract's `label`. */
export type SpinnerProps = SpinnerContractProps &
  Omit<
    ComponentPropsWithRef<"span">,
    keyof SpinnerContractProps | "color" | "aria-label" | "aria-hidden" | "children" | "role"
  >;
