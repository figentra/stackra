/**
 * Stackra file contract:
 * Purpose: `ContainerContext`, the React context `ContainerProvider` fills with the booted container and
 *          `useContainer` reads.
 * Boundary: holds the container only; `null` outside a provider, so the hook can refuse instead of inventing one. Not
 *           exported from the entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 23: a Provider is a React context component only); ADR 0295 (decision 10:
 *                     contexts mounted by createApp).
 */
import { createContext } from "react";

import type { Container } from "#core/index";

/** The container of the nearest `ContainerProvider`, or null. */
export const ContainerContext = createContext<Container | null>(null);
