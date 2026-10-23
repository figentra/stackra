/**
 * Stackra file contract:
 * Purpose: the React context the web `IconRegistryProvider` fills and `useIcon` reads.
 * Boundary: the context object only; its default is the empty registry, so a name outside a provider simply has no
 *          drawing and the reader decides what to show.
 * Runtime: browser
 * Governing contract: ADR 0303 (decision 10); ADR 0165 (UI contract, HeroUI v3 on web).
 */
import { createContext } from "react";

import type { IconRegistry } from "#contracts/types/icon-registry.type";

/** The icons of the nearest web provider, merged over its parents; empty outside one. */
export const IconRegistryContext = createContext<IconRegistry>(Object.freeze({}));
