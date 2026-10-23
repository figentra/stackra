/**
 * Stackra file contract:
 * Purpose: the React context the native `DesignSystemProvider` fills and `useDesignSystem` reads.
 * Boundary: the context object only; no default state, so a reader outside the provider is caught.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (UI contract).
 */
import { createContext } from "react";

import type { DesignSystemState } from "#contracts/types/design-system-state.type";

/** The design system state of the nearest native provider, or null outside one. */
export const DesignSystemContext = createContext<DesignSystemState | null>(null);
