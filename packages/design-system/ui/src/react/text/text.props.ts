/**
 * Stackra file contract:
 * Purpose: `TextProps`, the props of the web `Text` in `text.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0303 (decisions
 *          6 and 7); ADR 0165 (UI contract, HeroUI v3 on web).
 */
import type { TypographyRootProps } from "@heroui/react";
import type { TextContractProps } from "#contracts/types/text-contract-props.type";

/**
 * Props of the web Text: the shared contract plus HeroUI v3 Typography's own props, passed through unchanged.
 * HeroUI's `color` and `truncate` are the contract's `tone` and `isTruncated`, so the type refuses them.
 */
export type TextProps = TextContractProps &
  Omit<TypographyRootProps, keyof TextContractProps | "color" | "truncate">;
