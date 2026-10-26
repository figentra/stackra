/**
 * Stackra file contract:
 * Purpose: `RadioGroupProps`, the props of the web `RadioGroup` in `radio-group.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0165 (UI
 *          contract, HeroUI v3 on web); ADR 0303 (decision 7); ADR 0055 (forms); owner decision 6 of STA-350 (thin
 *          wrappers).
 */
import type { RadioGroupRootProps } from "@heroui/react";
import type { RadioGroupContractProps } from "#contracts/types/radio-group-contract-props.type";

/**
 * Props of the web RadioGroup: the shared contract plus HeroUI v3's own group props, passed through unchanged.
 * HeroUI's `children` is refused: the options are the content.
 */
export type RadioGroupProps = RadioGroupContractProps &
  Omit<RadioGroupRootProps, keyof RadioGroupContractProps | "children">;
