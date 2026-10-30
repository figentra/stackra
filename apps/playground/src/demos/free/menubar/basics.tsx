/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the web Menubar: an order editor's File, Edit, View and Help menus with sections,
 *          shortcut hints and a danger action, and the last action chosen written under it.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import { Menubar, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { MENUBAR_KEYS } from "#src/demos/free/menubar/menubar-keys.constant";

/** The demo's keys. */
const K = MENUBAR_KEYS.menubar.basics;

/** Menubar: Order editor. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const [last, setLast] = useState<string | null>(null);
  const item = (id: keyof typeof K & string, shortcut?: string) => ({
    id,
    label: t(K[id]),
    ...(shortcut === undefined ? {} : { shortcut }),
  });
  return (
    <div className="grid w-full max-w-xl gap-3">
      <Menubar
        aria-label={t(K.label)}
        className="border-b border-separator pb-1"
        onAction={(id) => setLast(t(K[id as keyof typeof K]))}
        menus={[
          {
            id: "file",
            label: t(K.file),
            sections: [
              {
                id: "create",
                title: t(K.create),
                isTitleHidden: true,
                items: [item("new_order", "Ctrl+N"), item("duplicate", "Ctrl+D")],
              },
              {
                id: "output",
                title: t(K.output),
                isTitleHidden: true,
                items: [item("export_csv"), item("print", "Ctrl+P")],
              },
              {
                id: "danger",
                title: t(K.archive),
                isTitleHidden: true,
                items: [{ ...item("archive"), tone: "danger" }],
              },
            ],
          },
          {
            id: "edit",
            label: t(K.edit),
            sections: [
              {
                id: "history",
                title: t(K.history),
                isTitleHidden: true,
                items: [item("undo", "Ctrl+Z"), item("redo", "Ctrl+Y")],
              },
              {
                id: "clipboard",
                title: t(K.clipboard),
                isTitleHidden: true,
                items: [item("cut", "Ctrl+X"), item("copy", "Ctrl+C"), item("paste", "Ctrl+V")],
              },
            ],
          },
          {
            id: "view",
            label: t(K.view),
            sections: [
              {
                id: "zoom",
                title: t(K.zoom),
                items: [item("zoom_in", "Ctrl+="), item("zoom_out", "Ctrl+−")],
              },
            ],
          },
          {
            id: "help",
            label: t(K.help),
            sections: [
              {
                id: "help",
                title: t(K.help),
                isTitleHidden: true,
                items: [item("shortcuts", "?"), item("contact")],
              },
            ],
          },
        ]}
      />
      <Text tone="muted">{t(K.last, { action: last ?? t(K.none) })}</Text>
    </div>
  );
}
