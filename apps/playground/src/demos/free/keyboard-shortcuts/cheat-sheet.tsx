/**
 * Stackra file contract:
 * Purpose: the "cheat-sheet" demo of the shortcut-aware UI: the shortcuts reference generated from the registry: grouped by scope, searchable, in every language. The page's own one opens with ?; this button opens the same sheet.
 * Boundary: a demo with no props, @stackra/ui, @stackra/shortcuts and local state only; the same file is the preview and
 *           the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0508; ADR 0060 (light, dark,
 *          RTL).
 */
import { Button, ShortcutCheatSheet, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { KEYBOARD_SHORTCUTS_KEYS } from "#src/demos/free/keyboard-shortcuts/keyboard-shortcuts-keys.constant";

/** The demo's keys. */
const K = KEYBOARD_SHORTCUTS_KEYS.keyboard_shortcuts;

/** The cheat sheet, opened by a button. */
export default function CheatSheet() {
  const t = useCatalogueText(MESSAGES.en);
  const [isOpen, setOpen] = useState(false);
  return (
    <div className="flex flex-col items-start gap-2">
      <Button variant="secondary" startIcon="keyboard" onPress={() => setOpen(true)}>
        {t(K.open_sheet)}
      </Button>
      <p className="m-0 text-sm text-muted">{t(K.sheet_help)}</p>
      {/* `shortcut={false}`: the DesignSystemProvider's own sheet already answers `?`. */}
      <ShortcutCheatSheet isOpen={isOpen} onOpenChange={setOpen} shortcut={false} />
    </div>
  );
}
