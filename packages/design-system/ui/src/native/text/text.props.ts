/**
 * Stackra file contract:
 * Purpose: `TextProps`, the props of the native `Text` in `text.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0303 (decisions
 *          6 and 7); ADR 0165 (HeroUI Native on native).
 */
import type { TypographyParagraphProps } from "heroui-native";
import type { TextContractProps } from "#contracts/types/text-contract-props.type";

/**
 * Props of the native Text: the shared contract plus HeroUI Native Typography.Paragraph's props, passed through.
 * HeroUI's `color` and `truncate` are the contract's `tone` and `isTruncated`, so the type refuses them.
 */
export type TextProps = TextContractProps &
  Omit<TypographyParagraphProps, keyof TextContractProps | "color" | "truncate">;
