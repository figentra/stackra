/**
 * Stackra file contract:
 * Purpose: `useDesignSystem()`, the hook a web component or switcher reads the scheme, locale and direction with.
 * Boundary: reads the context; throws outside a provider, because a silent default would hide a missing provider.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (UI contract).
 */
import { use } from "react";

import type { DesignSystemState } from "#contracts/types/design-system-state.type";

import { DesignSystemContext } from "./design-system-context";

/**
 * The design system state of the nearest `DesignSystemProvider`.
 * @returns the scheme (picked and resolved), locale, direction, theme and their setters
 */
export function useDesignSystem(): DesignSystemState {
  const state = use(DesignSystemContext);
  if (!state) throw new Error("useDesignSystem() needs a DesignSystemProvider above it");
  return state;
}
