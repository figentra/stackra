/**
 * Stackra file contract:
 * Purpose: the status chip a registry entry wears (`new`, `updated`, `preview`, `planned`) in the sidebar, on cards
 *          and next to a page title: one small soft `Chip` per status, its word from the `showcase` catalogue.
 * Boundary: presentation only; nothing for an entry without a status.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) sections 4 and 5.
 */
import type { Tone } from "@stackra/contracts";
import { Chip, useCatalogueText } from "@stackra/ui/react";
import type { ComponentStatus } from "@stackra/showcase";

import { MESSAGES } from "#src/constants/messages.constant";
import { SHOWCASE_KEYS } from "#src/constants/showcase-keys.constant";
import type { StatusChipProps } from "#src/components/status-chip/status-chip.props";

/** The colour role of each status. */
const TONES: Readonly<Record<ComponentStatus, Tone>> = {
  new: "success",
  updated: "accent",
  preview: "warning",
  planned: "default",
  beta: "warning",
  stable: "default",
};

/** The status chip of an entry. */
export function StatusChip({ status, showStable = false }: StatusChipProps) {
  const t = useCatalogueText(MESSAGES.en);
  // An entry with no status is stable; only a doc page says so, a card stays quiet.
  const shown = status ?? (showStable ? "stable" : undefined);
  if (!shown) return null;
  return (
    <Chip size="sm" variant="soft" tone={TONES[shown]}>
      {t(SHOWCASE_KEYS.showcase.status[shown])}
    </Chip>
  );
}
