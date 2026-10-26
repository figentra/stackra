/**
 * Stackra file contract:
 * Purpose: `LinkProps`, the props of the native `Link` in `link.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0303 (decisions
 *          5 and 7); ADR 0165 (HeroUI Native on native); owner decision 6 of STA-350.
 */
import type { LinkButtonProps } from "heroui-native";
import type { LinkContractProps } from "#contracts/types/link-contract-props.type";

/**
 * Props of the native Link: the shared contract plus HeroUI Native's LinkButton props, passed through unchanged. The
 * omitted names are the contract's own (`label`) or the wrapper's (the role, and the state HeroUI computes from
 * `isDisabled`).
 */
export type LinkProps = LinkContractProps &
  Omit<
    LinkButtonProps,
    | keyof LinkContractProps
    | "accessibilityRole"
    | "accessibilityState"
    | "accessibilityLabel"
    | "aria-label"
  >;
