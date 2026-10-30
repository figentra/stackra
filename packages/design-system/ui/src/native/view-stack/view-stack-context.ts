/**
 * Stackra file contract:
 * Purpose: the context the native `ViewStack` provides to its views, its back button and `useViewStack()`.
 * Boundary: internal, not in the `native` barrel; null outside a `ViewStack`.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3).
 */
import { createContext } from "react";

import type { ViewStackContextValue } from "#native/view-stack/view-stack-context-value.type";

/** The nearest view stack, or null outside one. */
export const ViewStackContext = createContext<ViewStackContextValue | null>(null);
