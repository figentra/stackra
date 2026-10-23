/**
 * Stackra file contract:
 * Purpose: the props every runtime's `Text` takes: the shared typography props and the text style.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303 (decision 7); ADR 0165 (UI
 *          contract).
 */
import type { TextType } from "#contracts/enums/text-type.enum";
import type { TypographyContractProps } from "#contracts/types/typography-contract-props.type";

/** Props shared by the web and native `Text`. */
export interface TextContractProps extends TypographyContractProps {
  /** The text style from the theme's type scale. Defaults to `body`. */
  readonly type?: TextType | undefined;
}
