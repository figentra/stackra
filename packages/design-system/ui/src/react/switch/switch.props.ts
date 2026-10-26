/**
 * Stackra file contract:
 * Purpose: `SwitchProps`, the props of the web `Switch` in `switch.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0165 (UI
 *          contract, HeroUI v3 on web); ADR 0303 (decision 7); ADR 0055 (forms); owner decision 6 of STA-350 (thin
 *          wrappers).
 */
import type { SwitchRootProps } from "@heroui/react";
import type { SwitchContractProps } from "#contracts/types/switch-contract-props.type";

/**
 * Props of the web Switch: the shared contract plus HeroUI v3's own switch props, passed through unchanged. HeroUI's
 * `isSelected`, `defaultSelected`, string `value` and `children` are refused: the contract names each of them once.
 */
export type SwitchProps = SwitchContractProps &
  Omit<SwitchRootProps, keyof SwitchContractProps | "isSelected" | "defaultSelected" | "children">;
