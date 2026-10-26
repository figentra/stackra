/**
 * Stackra file contract:
 * Purpose: `IconProps`, the props of the web `Icon` in `icon.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0303 (decisions
 *          3 and 7); ADR 0165 (HeroUI v3 on web; Lucide); ADR 0060 (RTL); ADR 0303 (decision 10).
 */
import type { LucideProps } from "lucide-react";
import type { IconContractProps } from "#contracts/types/icon-contract-props.type";

/** SVG attributes that reach the drawn icon; the contract's props, colour and accessible name stay the wrapper's. */
type IconPassthroughProps = Omit<
  LucideProps,
  | keyof IconContractProps
  | "color"
  | "width"
  | "height"
  | "absoluteStrokeWidth"
  | "role"
  | "aria-label"
  | "aria-hidden"
  | "title"
>;

/**
 * Props of the web Icon: the shared contract plus the SVG attributes lucide-react takes, passed through unchanged.
 * An icon is not a control: for something pressable use a button that holds an icon.
 */
export type IconProps = IconContractProps & IconPassthroughProps;
