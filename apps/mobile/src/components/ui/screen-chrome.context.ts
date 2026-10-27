/**
 * Stackra file contract:
 * Purpose: `ScreenChrome`: the chrome the nearest wrapper gives the screen inside it; none by default.
 * Boundary: the React context only, in its own file; `Screen` provides it.
 * Runtime: react-native
 * Governing contract: ADR 0320 (glass and the showcase stage); ADR 0305 (rule 10).
 */
import { createContext } from "react";
import type { ScreenChromeValue } from "./screen-chrome-value.type";

/** The chrome the nearest wrapper gives the screen inside it; none by default. */
export const ScreenChrome = createContext<ScreenChromeValue>({});
