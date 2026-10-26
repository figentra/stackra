/**
 * Stackra file contract:
 * Purpose: `LabelProps`, the props of the native `Label` in `label.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0165 (HeroUI
 *          Native on native); ADR 0055 (forms); ADR 0303.
 */
import type { Label as HeroLabel } from "heroui-native";
import type { ComponentPropsWithRef } from "react";
import type { LabelContractProps } from "#contracts/types/label-contract-props.type";

/** Props of the native Label: the shared contract plus HeroUI Native's own label props, passed through unchanged. */
export type LabelProps = LabelContractProps &
  Omit<ComponentPropsWithRef<typeof HeroLabel>, keyof LabelContractProps>;
