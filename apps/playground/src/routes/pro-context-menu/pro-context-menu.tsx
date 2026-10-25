/**
 * Stackra file contract:
 * Purpose: the page of the ContextMenu route: `@stackra-pro/ui`'s ContextMenu on a work area that opens on a secondary
 *          press or a long press, with items, a submenu, a separator and a danger item, and a named button that opens
 *          the same menu, with a line that says which item ran last.
 * Boundary: presentation and local state only. A secondary press is pointer-only, so the button is the keyboard and
 *          screen-reader path, through the controlled `isOpen`.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0060 (light, dark, RTL); STA-416 FR-012.
 */
import * as Ui from "@stackra/ui/react";
import * as UiPro from "@stackra-pro/ui/react";
import { useState } from "react";

import { ProContextMenuRoute } from "#src/routes/pro-context-menu/pro-context-menu.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::pro-context-menu.*` keys.
const STRINGS = {
  documentTitle: `${ProContextMenuRoute.title} · Stackra Playground`,
  intro:
    "A menu that opens where you press the secondary button, or on a long press. The button below opens the same menu from the keyboard; the arrow keys move, Enter chooses and Escape closes.",
  menu: "Work area menu",
  area: "Work area",
  workArea: "Right-click or long-press anywhere in this area.",
  open: "Open the work area menu",
  none: "No item has been chosen yet.",
  last: (label: string) => `Last item: ${label}`,
  rename: "Rename",
  duplicate: "Duplicate",
  share: "Share",
  link: "Copy link",
  email: "Send by email",
  archive: "Archive",
  delete: "Delete",
} as const;

/** The ContextMenu page. */
export function ProContextMenu() {
  const [isOpen, setOpen] = useState(false);
  const [last, setLast] = useState<string | null>(null);
  const onAction = (key: string | number) => setLast(String(key));

  return (
    <article className="grid gap-6">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <h1 className="type-h1">{ProContextMenuRoute.title}</h1>
        <p className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </p>
      </header>
      <section aria-labelledby="menu-heading" className="grid gap-3">
        <h2 id="menu-heading" className="type-h2">
          {STRINGS.area}
        </h2>
        <div>
          <Ui.Button variant="secondary" onPress={() => setOpen(true)}>
            {STRINGS.open}
          </Ui.Button>
        </div>
        <UiPro.ContextMenu isOpen={isOpen} onOpenChange={setOpen}>
          <UiPro.ContextMenu.Trigger>
            <div className="flex h-40 max-w-md select-none items-center justify-center rounded-xl border border-dashed border-border p-4 text-center">
              <bdi>{STRINGS.workArea}</bdi>
            </div>
          </UiPro.ContextMenu.Trigger>
          <UiPro.ContextMenu.Popover>
            <UiPro.ContextMenu.Menu label={STRINGS.menu} onAction={onAction}>
              <UiPro.ContextMenu.Item id="rename" textValue={STRINGS.rename}>
                <Ui.Label>{STRINGS.rename}</Ui.Label>
              </UiPro.ContextMenu.Item>
              <UiPro.ContextMenu.Item id="duplicate" textValue={STRINGS.duplicate}>
                <Ui.Label>{STRINGS.duplicate}</Ui.Label>
              </UiPro.ContextMenu.Item>
              <UiPro.ContextMenu.SubmenuTrigger>
                <UiPro.ContextMenu.Item id="share" textValue={STRINGS.share}>
                  <Ui.Label>{STRINGS.share}</Ui.Label>
                  <UiPro.ContextMenu.SubmenuIndicator />
                </UiPro.ContextMenu.Item>
                <UiPro.ContextMenu.Popover>
                  <UiPro.ContextMenu.Menu label={STRINGS.share} onAction={onAction}>
                    <UiPro.ContextMenu.Item id="link" textValue={STRINGS.link}>
                      <Ui.Label>{STRINGS.link}</Ui.Label>
                    </UiPro.ContextMenu.Item>
                    <UiPro.ContextMenu.Item id="email" textValue={STRINGS.email}>
                      <Ui.Label>{STRINGS.email}</Ui.Label>
                    </UiPro.ContextMenu.Item>
                  </UiPro.ContextMenu.Menu>
                </UiPro.ContextMenu.Popover>
              </UiPro.ContextMenu.SubmenuTrigger>
              <UiPro.ContextMenu.Separator />
              <UiPro.ContextMenu.Item id="archive" textValue={STRINGS.archive}>
                <Ui.Label>{STRINGS.archive}</Ui.Label>
              </UiPro.ContextMenu.Item>
              <UiPro.ContextMenu.Item id="delete" textValue={STRINGS.delete} variant="danger">
                <Ui.Label>{STRINGS.delete}</Ui.Label>
              </UiPro.ContextMenu.Item>
            </UiPro.ContextMenu.Menu>
          </UiPro.ContextMenu.Popover>
        </UiPro.ContextMenu>
        <p role="status">
          <bdi>{last === null ? STRINGS.none : STRINGS.last(last)}</bdi>
        </p>
      </section>
    </article>
  );
}
