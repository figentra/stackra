/**
 * Stackra file contract:
 * Purpose: `ShowcaseToastStyleContext`, the app's one toast stack style, provided by `ShowcaseToasts`: a phone shows
 *          one provider for the whole app (a provider per demo would fight over the single `toast()` bridge), so the
 *          toast "styles" demo changes the app's provider through this context.
 * Boundary: null outside `ShowcaseToasts`.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decision 3).
 */
import { createContext } from "react";

import type { ShowcaseToastStyle } from "./showcase-toast-style.type";

/** The toast stack style of the app, or null outside `ShowcaseToasts`. */
export const ShowcaseToastStyleContext = createContext<ShowcaseToastStyle | null>(null);
