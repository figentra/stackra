/**
 * Stackra file contract:
 * Purpose: `SpinnerProps`, the props of the web `Spinner` in `spinner.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0303 (decision
 *          7); ADR 0304; ADR 0165 (HeroUI v3 on web); owner decision 6 of STA-350 (thin wrappers).
 */
import type { SpinnerRootProps } from "@heroui/react";
import type { ComponentPropsWithRef } from "react";
import type { SpinnerContractProps } from "#contracts/types/spinner-contract-props.type";

/** HeroUI's props for a `span` spinner: its own props plus the `span` attributes, as its generic signature spreads them. */
type HeroSpinnerProps = SpinnerRootProps<"span"> &
  Omit<ComponentPropsWithRef<"span">, keyof SpinnerRootProps<"span">>;

/**
 * Props of the web Spinner: the shared contract plus HeroUI v3's own spinner props, passed through unchanged.
 * HeroUI's `color` is the contract's `tone`, `label` owns the accessible name, and HeroUI draws its own SVG.
 */
export type SpinnerProps = SpinnerContractProps &
  Omit<
    HeroSpinnerProps,
    keyof SpinnerContractProps | "color" | "aria-label" | "aria-hidden" | "children"
  >;
