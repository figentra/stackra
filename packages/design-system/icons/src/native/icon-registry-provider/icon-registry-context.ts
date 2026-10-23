/**
 * Stackra file contract:
 * Purpose: the React context the native `IconRegistryProvider` fills and `useIcon` reads.
 * Boundary: the context object only; its default is the empty registry, so a name outside a provider simply has no
 *          drawing and the reader decides what to show.
 * Runtime: react-native
 * Governing contract: ADR 0303 (decision 10); ADR 0165 (UI contract, HeroUI Native on native).
 */
import { createContext } from "react";

import type { IconRegistry } from "#contracts/types/icon-registry.type";

/** The icons of the nearest native provider, merged over its parents; empty outside one. */
export const IconRegistryContext = createContext<IconRegistry>(Object.freeze({}));
