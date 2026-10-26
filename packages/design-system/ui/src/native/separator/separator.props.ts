/**
 * Stackra file contract:
 * Purpose: `SeparatorProps`, the props of the native `Separator` in `separator.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0165 (HeroUI
 *          Native on native); ADR 0304.
 */
import type { Separator as HeroSeparator } from "heroui-native";
import type { ComponentPropsWithRef } from "react";
import type { SeparatorContractProps } from "#contracts/types/separator-contract-props.type";

/** Props of the native Separator: the shared contract plus HeroUI Native's own separator props, passed through. */
export type SeparatorProps = SeparatorContractProps &
  Omit<ComponentPropsWithRef<typeof HeroSeparator>, keyof SeparatorContractProps>;
