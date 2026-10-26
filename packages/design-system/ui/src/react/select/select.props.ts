/**
 * Stackra file contract:
 * Purpose: `SelectProps`, the props of the web `Select` in `select.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0165 (UI
 *          contract, HeroUI v3 on web); ADR 0055 (one field contract); owner decision 6 of STA-350 (thin wrappers).
 */
import type { SelectRootProps } from "@heroui/react";
import type { SelectContractProps } from "#contracts/types/select-contract-props.type";
import type { SelectItem } from "#contracts/types/select-item.type";

/**
 * Props of the web Select: the shared contract plus HeroUI v3's own select props, passed through unchanged. HeroUI's
 * `fullWidth` is the contract's `isFullWidth`; the app lists choices as `items`, never as children.
 */
export type SelectProps = SelectContractProps &
  Omit<SelectRootProps<SelectItem>, keyof SelectContractProps | "children" | "items" | "fullWidth">;
