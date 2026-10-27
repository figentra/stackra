/**
 * Stackra file contract:
 * Purpose: `themeSettings`, the app's one theme settings store, the native twin of the playground's Theme Studio
 *          state (`createThemeSettingsStore`): knobs with undo, redo and reset; every change derived and pushed into
 *          Uniwind's light and dark themes, so the whole app restyles at once; slider drafts; the contrast readout
 *          (`contrastReport`). `useThemeSettings` reads it in a component.
 * Boundary: the one instance only; the behaviour is `createThemeSettingsStore`'s.
 * Runtime: react-native
 * Governing contract: ADR 0320 (the Theme Studio); ADR 0302 (Stackra Design System); WCAG 2.2 SC 1.4.3, 1.4.11.
 */
import { createThemeSettingsStore } from "./create-theme-settings-store.function";

/** The app's one theme settings store. */
export const themeSettings = createThemeSettingsStore();
