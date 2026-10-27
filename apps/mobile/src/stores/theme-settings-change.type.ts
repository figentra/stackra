/**
 * Stackra file contract:
 * Purpose: `ThemeSettingsChange`: a change to the settings.
 * Boundary: a type only, in its own file.
 * Runtime: react-native
 * Governing contract: ADR 0320 (the Theme Studio); ADR 0302 (Stackra Design System); ADR 0305 (rule 10).
 */
import type { ThemeStep } from "./theme-step.type";

/** A change to the settings. */
export type ThemeSettingsChange =
  | { readonly type: "change"; readonly step: ThemeStep }
  | { readonly type: "draft"; readonly step: ThemeStep }
  | { readonly type: "undo" }
  | { readonly type: "redo" }
  | { readonly type: "reset" };
