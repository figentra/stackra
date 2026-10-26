/**
 * Stackra file contract:
 * Purpose: `IconProps`, the props of the native `Icon` in `icon.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0303 (decisions
 *          3 and 7); ADR 0165 (HeroUI Native on native); ADR 0060 (RTL); ADR 0303 (decision 10).
 */
import type { LucideProps } from "lucide-react-native";
import type { IconContractProps } from "#contracts/types/icon-contract-props.type";

/** Svg and View props that reach the drawn icon; the contract's props, colour and accessibility stay the wrapper's. */
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
  | "accessible"
  | "accessibilityLabel"
  | "accessibilityRole"
  | "accessibilityElementsHidden"
  | "importantForAccessibility"
>;

/** Props of the native Icon: the shared contract plus the Svg and View props lucide-react-native takes. */
export type IconProps = IconContractProps & IconPassthroughProps;
