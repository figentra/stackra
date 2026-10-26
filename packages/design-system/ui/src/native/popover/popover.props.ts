/**
 * Stackra file contract:
 * Purpose: `PopoverProps`, the props of the native `Popover` in `popover.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0303 (decision
 *          7); ADR 0312; ADR 0165 (HeroUI Native on native).
 */
import type { PopoverContentProps } from "heroui-native";
import type { PopoverContractProps } from "#contracts/types/popover-contract-props.type";

/** HeroUI Native's content props for the floating presentation: the bottom sheet one is not offered. */
type HeroPopoverContentProps = Extract<PopoverContentProps, { presentation: "popover" }>;

/**
 * Props of the native Popover: the shared contract plus HeroUI Native's own popover content props, passed through.
 * HeroUI's `presentation` is fixed to the floating form.
 */
export type PopoverProps = PopoverContractProps &
  Omit<HeroPopoverContentProps, keyof PopoverContractProps | "presentation">;
