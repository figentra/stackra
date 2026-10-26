/**
 * Stackra file contract:
 * Purpose: `TextFieldProps`, the props of the web `TextField` in `text-field.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0303 (decision
 *          7); ADR 0165 (UI contract, HeroUI v3 on web); ADR 0055 (forms: one field contract); owner decision 6 of
 *          STA-350 (thin wrappers).
 */
import type { TextFieldRootProps } from "@heroui/react";
import type { TextFieldContractProps } from "#contracts/types/text-field-contract-props.type";

/**
 * Props of the web TextField: the shared contract plus HeroUI v3's own text field props, passed through unchanged.
 * HeroUI's `fullWidth` is the contract's `isFullWidth`, and `children` is refused because the field draws its own parts.
 */
export type TextFieldProps = TextFieldContractProps &
  Omit<TextFieldRootProps, keyof TextFieldContractProps | "children" | "fullWidth">;
