/**
 * Stackra file contract:
 * Purpose: `CheckboxProps`, the props of the web `Checkbox` in `checkbox.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0165 (UI
 *          contract, HeroUI v3 on web); ADR 0303 (decision 7); ADR 0055 (forms); owner decision 6 of STA-350 (thin
 *          wrappers).
 */
import type { CheckboxRootProps } from "@heroui/react";
import type { CheckboxContractProps } from "#contracts/types/checkbox-contract-props.type";

/**
 * Props of the web Checkbox: the shared contract plus HeroUI v3's own checkbox props, passed through unchanged.
 * HeroUI's `isSelected`, `defaultSelected`, string `value` and `children` are refused: the contract names each once.
 */
export type CheckboxProps = CheckboxContractProps &
  Omit<
    CheckboxRootProps,
    keyof CheckboxContractProps | "isSelected" | "defaultSelected" | "children"
  >;
