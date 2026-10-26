/**
 * Stackra file contract:
 * Purpose: `ReactNavigationProviderProps`, the props of the native `ReactNavigationProvider`: the tree whose links
 *          navigate through React Navigation.
 * Boundary: a type only.
 * Runtime: react-native
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0317 (decision 2).
 */
import type { ReactNode } from "react";

/** Props of `ReactNavigationProvider`. */
export interface ReactNavigationProviderProps {
  /** The tree whose links navigate through React Navigation. */
  readonly children?: ReactNode;
}
