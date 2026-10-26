/**
 * Stackra file contract:
 * Purpose: `DescriptionProps`, the props of the native `Description` in `description.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0165 (HeroUI
 *          Native on native); ADR 0055 (forms); ADR 0303.
 */
import type { Description as HeroDescription } from "heroui-native";
import type { ComponentPropsWithRef } from "react";
import type { DescriptionContractProps } from "#contracts/types/description-contract-props.type";

/** Props of the native Description: the shared contract plus HeroUI Native's own props, passed through unchanged. */
export type DescriptionProps = DescriptionContractProps &
  Omit<ComponentPropsWithRef<typeof HeroDescription>, keyof DescriptionContractProps>;
