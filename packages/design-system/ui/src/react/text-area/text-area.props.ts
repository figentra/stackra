/**
 * Stackra file contract:
 * Purpose: `TextAreaProps`, the props of the web `TextArea` in `text-area.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0303 (decision
 *          7); ADR 0165 (UI contract, HeroUI v3 on web); ADR 0055 (forms: one field contract); owner decision 6 of
 *          STA-350 (thin wrappers).
 */
import type { TextFieldRootProps } from "@heroui/react";
import type { TextAreaContractProps } from "#contracts/types/text-area-contract-props.type";

/**
 * Props of the web TextArea: the shared contract plus HeroUI v3's own text field props, passed through unchanged.
 * HeroUI's `fullWidth` is the contract's `isFullWidth`; `children` is refused because the field draws its own parts,
 * and `type` because an area has no kind of text.
 */
export type TextAreaProps = TextAreaContractProps &
  Omit<TextFieldRootProps, keyof TextAreaContractProps | "children" | "fullWidth" | "type">;
