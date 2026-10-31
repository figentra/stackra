/**
 * Stackra file contract:
 * Purpose: `StudioLock`, the lock beside one Theme Studio value: a locked value keeps its setting when Randomize runs.
 * Boundary: a toggle only; the locks live in the page's address (`locks`).
 * Runtime: browser
 * Governing contract: ADR 0501 (section 5: the Theme Studio).
 */
import { IconButton, useCatalogueText } from "@stackra/ui/react";

import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { THEME_STUDIO_KEYS } from "#src/routes/theme-studio/theme-studio-keys.constant";

import type { StudioLockProps } from "./studio-lock.props";

const K = THEME_STUDIO_KEYS.theme_studio.controls;

/** The lock beside one value. */
export function StudioLock({ label, isLocked, onChange }: StudioLockProps) {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <IconButton
      size="sm"
      variant={isLocked ? "secondary" : "ghost"}
      label={t(K.lock, { name: label })}
      aria-pressed={isLocked}
      onPress={() => onChange(!isLocked)}
      icon={isLocked ? Icons.Lock : Icons.LockOpen}
    />
  );
}
