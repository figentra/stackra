/**
 * Stackra file contract:
 * Purpose: `useIcon(name)`, the hook the web `Icon` resolves an `IconName` to a component with.
 * Boundary: reads the context and looks the name up (aliases included); it never throws, because a data-driven name
 *          may be valid and still unregistered.
 * Runtime: browser
 * Governing contract: ADR 0303 (decision 10); ADR 0165 (UI contract, HeroUI v3 on web).
 */
import { use } from "react";

import type { IconComponent } from "#contracts/types/icon-component.type";
import type { IconName } from "#contracts/types/icon-name.type";
import { findIcon } from "#core/functions/find-icon.function";

import { IconRegistryContext } from "./icon-registry-context";

/**
 * The component the nearest registry holds for a name.
 * @param name - the icon to draw
 * @returns the component, or undefined when no registry above holds the name or its alias target
 */
export function useIcon(name: IconName): IconComponent | undefined {
  return findIcon(use(IconRegistryContext), name);
}
