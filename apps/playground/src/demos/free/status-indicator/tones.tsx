/**
 * Stackra file contract:
 * Purpose: the "tones" demo of the web StatusIndicator: the five states, each with its own shape, in three sizes, so
 *          they read apart in greyscale too.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); gap inventory row 30; ADR 0060
 *          (light, dark, RTL).
 */
import type { Tone } from "@stackra/contracts";
import type { Size } from "@stackra/ui/contracts";
import { StatusIndicator, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { STATUS_INDICATOR_KEYS } from "#src/demos/free/status-indicator/status-indicator-keys.constant";

/** The demo's keys. */
const K = STATUS_INDICATOR_KEYS.status_indicator;

/** A realistic state for each tone. */
const STATE = {
  default: K.draft,
  accent: K.scheduled,
  success: K.ready,
  warning: K.waiting,
  danger: K.late,
} as const satisfies Record<Tone, unknown>;

const TONES = Object.keys(STATE) as Tone[];
const SIZES: readonly Size[] = ["sm", "md", "lg"];

/** Status indicator: Tones and shapes. */
export default function Tones() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="grid gap-4">
      {SIZES.map((size) => (
        <div key={size} className="flex flex-wrap items-center gap-5">
          {TONES.map((tone) => (
            <StatusIndicator key={tone} tone={tone} size={size}>
              {t(STATE[tone])}
            </StatusIndicator>
          ))}
        </div>
      ))}
    </div>
  );
}
