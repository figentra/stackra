/**
 * Stackra file contract:
 * Purpose: `FULLSCREEN_BAR_ICONS`, the drawing of the native FullscreenBar's exit icon, `minimize-2`.
 * Boundary: a registry the bar nests around its own icon only, so it never touches the app's or `UI_ICONS`.
 * Runtime: react-native
 * Governing contract: ADR 0303 (decision 10); GAPS.md row 32 (owner decision 2026-10-28).
 */
import { defineIconRegistry } from "@stackra/icons";
import { Minimize2 } from "@stackra/icons/native/lucide-icons";

/** The icons the native FullscreenBar draws on its own. */
export const FULLSCREEN_BAR_ICONS = defineIconRegistry({ "minimize-2": Minimize2 });
