/**
 * Stackra file contract:
 * Purpose: gives the pages that draw a message in a tone (AlertDialog, useConfirmation, LeaveConfirmation) the four
 *          icons a tone draws by default, by name: the registry of `FEEDBACK_BY_TONE`'s icons, which the app's own
 *          registry does not hold until gen emits it from the names in use.
 * Boundary: the registry and its provider only; it nests inside `PlaygroundIcons` and merges with it, the nearest
 *           winning, so a page keeps the icons of the shell. Gen will emit this registry, and refuse an unknown name
 *           (STA-339); until then it is written by hand.
 * Runtime: browser
 * Governing contract: ADR 0303 (decision 10); ADR 0312; ADR 0183 (budgets).
 */
import { defineIconRegistry } from "@stackra/icons";
import { IconRegistryProvider } from "@stackra/icons/react";
import { CircleAlert, CircleCheck, Info, TriangleAlert } from "@stackra/icons/react/lucide-icons";
import type { ReactNode } from "react";

/** The icons the tones draw by default, by name. */
const TONE_ICONS = defineIconRegistry({
  info: Info,
  "circle-check": CircleCheck,
  "triangle-alert": TriangleAlert,
  "circle-alert": CircleAlert,
});

/** Props of {@link ToneIcons}. */
export interface ToneIconsProps {
  /** The tree whose messages draw a tone's icon. */
  children: ReactNode;
}

/** Provides the tone icons to everything below it, on top of the icons already provided. */
export function ToneIcons({ children }: ToneIconsProps) {
  return <IconRegistryProvider registry={TONE_ICONS}>{children}</IconRegistryProvider>;
}
