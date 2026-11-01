/**
 * Stackra file contract:
 * Purpose: the "toolbar" demo of the shortcut-aware UI: a toolbar whose actions are defined once ({ id, label, icon, shortcut, run }) and drive the buttons, their keys, the tooltips, the cheat sheet and the palette. Ask Tamo keeps its reserved Mod+J.
 * Boundary: a demo with no props, @stackra/ui, @stackra/shortcuts and local state only; the same file is the preview and
 *           the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0508; ADR 0060 (light, dark,
 *          RTL).
 */
import { STANDARD_SHORTCUTS, type ShortcutAction } from "@stackra/shortcuts";
import { Button, IconButton, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { KEYBOARD_SHORTCUTS_KEYS } from "#src/demos/free/keyboard-shortcuts/keyboard-shortcuts-keys.constant";

/** The demo's keys. */
const K = KEYBOARD_SHORTCUTS_KEYS.keyboard_shortcuts;

/** A toolbar of shortcut-aware actions. */
export default function Toolbar() {
  const t = useCatalogueText(MESSAGES.en);
  const [ran, setRan] = useState("");
  const action = (id: string, label: string, shortcut: string, icon: ShortcutAction["icon"]) =>
    ({ id, label, shortcut, icon, run: () => setRan(label) }) satisfies ShortcutAction;
  const save = action("demo.save", t(K.save), "mod+s", "save");
  const duplicate = action("demo.duplicate", t(K.duplicate), "mod+shift+d", "copy");
  const archive = action("demo.archive", t(K.archive), "e", "archive");
  const search = action("demo.search", t(K.search), "/", "search");
  const tamo = action("ai.ask", t(K.ask_tamo), STANDARD_SHORTCUTS["ai.ask"] ?? "mod+j", "sparkles");
  return (
    <div className="flex flex-col items-start gap-3">
      <div role="toolbar" aria-label={t(K.toolbar)} className="flex flex-wrap items-center gap-2">
        <Button action={save} />
        <Button action={duplicate} variant="secondary" />
        <Button action={archive} variant="secondary" />
        <IconButton icon="search" label={search.label} action={search} variant="ghost" />
        <IconButton icon="sparkles" label={tamo.label} action={tamo} variant="ghost" />
      </div>
      <p role="status" className="m-0 text-sm text-muted">
        {ran ? t(K.ran, { action: ran }) : t(K.idle)}
      </p>
    </div>
  );
}
