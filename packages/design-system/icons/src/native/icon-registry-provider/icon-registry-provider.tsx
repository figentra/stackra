/**
 * Stackra file contract:
 * Purpose: the native `IconRegistryProvider`: gives every `Icon` below it the registry it resolves `IconName` through.
 *          Providers nest and merge, the nearest winning, so a module can add its own namespaced icons without
 *          rebuilding the app's registry.
 * Boundary: holds a registry in context and draws nothing; where the registry comes from (a hand-built one, the full
 *          Lucide opt-in, or the one gen emits from the names actually used) is the app's choice.
 * Runtime: react-native
 * Governing contract: ADR 0303 (decision 10); ADR 0165 (UI contract, HeroUI Native on native).
 */
import { use, useMemo, type ReactNode } from "react";

import type { IconRegistry } from "#contracts/types/icon-registry.type";

import { IconRegistryContext } from "./icon-registry-context";

/** Props of the native IconRegistryProvider. */
export interface IconRegistryProviderProps {
  /** The icons to make available below, by name; they win over the same names from a provider above. */
  readonly registry: IconRegistry;
  /** The tree that draws icons. */
  readonly children?: ReactNode;
}

/** Makes a registry of icons available to every `Icon` below it. */
export function IconRegistryProvider({ registry, children }: IconRegistryProviderProps) {
  const parent = use(IconRegistryContext);
  const merged = useMemo(() => Object.freeze({ ...parent, ...registry }), [parent, registry]);
  return <IconRegistryContext value={merged}>{children}</IconRegistryContext>;
}
