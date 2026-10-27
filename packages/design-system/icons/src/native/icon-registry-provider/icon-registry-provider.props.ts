/**
 * Stackra file contract:
 * Purpose: `IconRegistryProviderProps`, the props of the native `IconRegistryProvider` in `icon-registry-provider.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0303 (decision 10).
 */
import type { ReactNode } from "react";

import type { IconRegistry } from "#contracts/types/icon-registry.type";

/** Props of the native IconRegistryProvider. */
export interface IconRegistryProviderProps {
  /** The icons to make available below, by name; they win over the same names from a provider above. */
  readonly registry: IconRegistry;
  /** The tree that draws icons. */
  readonly children?: ReactNode;
}
