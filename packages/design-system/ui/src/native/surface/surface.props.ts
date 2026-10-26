/**
 * Stackra file contract:
 * Purpose: `SurfaceProps`, the props of the native `Surface` in `surface.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0165 (HeroUI
 *          Native on native); ADR 0304; owner decision 6 of STA-350 (thin wrappers).
 */
import type { Surface as HeroSurface } from "heroui-native";
import type { ComponentPropsWithRef } from "react";
import type { SurfaceContractProps } from "#contracts/types/surface-contract-props.type";

/** Props of the native Surface: the shared contract plus HeroUI Native's own surface props, passed through unchanged. */
export type SurfaceProps = SurfaceContractProps &
  Omit<ComponentPropsWithRef<typeof HeroSurface>, keyof SurfaceContractProps>;
