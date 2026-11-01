/**
 * Stackra file contract:
 * Purpose: the "reveal" demo of the shortcut-aware UI: hold Mod (Command or Control) for half a second and a badge shows the keys over every action, also the icon buttons whose keys otherwise sit in their tooltips.
 * Boundary: a demo with no props, @stackra/ui, @stackra/shortcuts and local state only; the same file is the preview and
 *           the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0508; ADR 0060 (light, dark,
 *          RTL).
 */
import { isApplePlatform } from "@stackra/shortcuts";
import { IconButton, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { KEYBOARD_SHORTCUTS_KEYS } from "#src/demos/free/keyboard-shortcuts/keyboard-shortcuts-keys.constant";

/** The demo's keys. */
const K = KEYBOARD_SHORTCUTS_KEYS.keyboard_shortcuts;

/** Hold Mod to reveal every shortcut. */
export default function Reveal() {
  const t = useCatalogueText(MESSAGES.en);
  const [ran, setRan] = useState("");
  const actions = [
    { icon: "plus" as const, label: t(K.new_order), shortcut: "alt+n" },
    { icon: "rotate-ccw" as const, label: t(K.refund), shortcut: "alt+r" },
    { icon: "printer" as const, label: t(K.print), shortcut: "alt+p" },
    { icon: "message-square" as const, label: t(K.comment), shortcut: "c" },
  ];
  return (
    <div className="flex flex-col items-start gap-8">
      <p className="m-0 text-sm text-muted">
        {t(K.reveal_help, { modifier: isApplePlatform() ? "⌘" : "Ctrl" })}
      </p>
      <div className="flex flex-wrap gap-4">
        {actions.map((action) => (
          <IconButton
            key={action.shortcut}
            icon={action.icon}
            label={action.label}
            shortcut={action.shortcut}
            variant="secondary"
            onPress={() => setRan(action.label)}
          />
        ))}
      </div>
      <p role="status" className="m-0 text-sm text-muted">
        {ran ? t(K.ran, { action: ran }) : ""}
      </p>
    </div>
  );
}
