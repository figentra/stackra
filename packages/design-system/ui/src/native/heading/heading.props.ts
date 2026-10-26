/**
 * Stackra file contract:
 * Purpose: `HeadingProps`, the props of the native `Heading` in `heading.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0303 (decisions
 *          6 and 7); ADR 0165 (UI contract); WCAG 2.2 SC 1.3.1.
 */
import type { TypographyHeadingProps } from "heroui-native";
import type { HeadingContractProps } from "#contracts/types/heading-contract-props.type";

/**
 * Props of the native Heading: the shared contract plus HeroUI Native Typography.Heading's props, passed through.
 * HeroUI's `color` and `truncate` are the contract's `tone` and `isTruncated`.
 */
export type HeadingProps = HeadingContractProps &
  Omit<TypographyHeadingProps, keyof HeadingContractProps | "color" | "truncate">;
