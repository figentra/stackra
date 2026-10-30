/**
 * Stackra file contract:
 * Purpose: the "checkable" demo of the web Menubar: an orders list's View menu of columns to show (any number) and
 *          row density (one), and a Sort menu (one), with the checked options written under it.
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
const K = MENUBAR_KEYS.menubar.checkable;

/** Menubar: Checkable view options. */
export default function Checkable() {
  const t = useCatalogueText(MESSAGES.en);
  const [checked, setChecked] = useState<readonly string[]>(["tax", "comfortable", "newest"]);
  const item = (id: keyof typeof K & string) => ({ id, label: t(K[id]) });
  return (
    <div className="grid w-full max-w-xl gap-3">
      <Menubar
        aria-label={t(K.label)}
        className="border-b border-separator pb-1"
        value={checked}
        onChange={setChecked}
        menus={[
          {
            id: "view",
            label: t(K.view),
            selectionMode: "single",
            sections: [
              { id: "density", title: t(K.density), items: [item("compact"), item("comfortable")] },
            ],
          },
          {
            id: "columns",
            label: t(K.columns),
            selectionMode: "multiple",
            sections: [
              {
                id: "columns",
                title: t(K.columns),
                isTitleHidden: true,
                items: [item("tax"), item("discounts"), item("notes")],
              },
            ],
          },
          {
            id: "sort",
            label: t(K.sort),
            selectionMode: "single",
            sections: [
              {
                id: "order",
                title: t(K.order),
                items: [item("newest"), item("oldest"), item("highest")],
              },
            ],
          },
        ]}
      />
      <Text tone="muted">
        {t(K.summary, {
          options: checked.map((id) => t(K[id as keyof typeof K])).join(t(K.separator)),
        })}
      </Text>
    </div>
  );
}
