/**
 * Stackra file contract:
 * Purpose: the React context the web `ConfirmationProvider` fills and `useConfirmation` reads.
 * Boundary: the context object only; no default, so a reader outside the provider is caught.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0312.
 */
import { createContext } from "react";

import type { ConfirmFunction } from "#contracts/types/confirm-function.type";

/** The `confirm` function of the nearest web provider, or null outside one. */
export const ConfirmationContext = createContext<ConfirmFunction | null>(null);
