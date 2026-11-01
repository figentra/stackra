/**
 * Stackra file contract:
 * Purpose: the web `ShortcutCheatSheet`: a dialog listing every action the shortcut registry holds right now, grouped
 *          (the action's group, else its scope: everywhere, this page, this dialog, this control), searchable, each
 *          with its keys in HeroUI's Kbd. `?` (Shift+/) opens it from anywhere; `DesignSystemProvider` mounts one.
 * Boundary: reads `useShortcutRegistry`; lists only what is registered and allowed, so a disabled or refused action
 *           is absent. The search folds case, accents and Arabic diacritics (`normalizeSearchText`) and matches the
 *           words and the keys.
 * Runtime: browser
 * Governing contract: ADR 0508 (cheat sheet); WCAG 2.2 SC 2.1.1.
 */
import { formatShortcutKeys, STANDARD_SHORTCUTS } from "@stackra/shortcuts";
import { useShortcutAction, useShortcutRegistry } from "@stackra/shortcuts/react";
import { type ReactElement, useState } from "react";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { normalizeSearchText } from "#core/functions/normalize-search-text.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { Modal } from "#react/modal/modal";
import { SearchField } from "#react/search-field/search-field";
import { ShortcutHint } from "#react/shortcut-hint/shortcut-hint";
import type { ShortcutCheatSheetProps } from "#react/shortcut-cheat-sheet/shortcut-cheat-sheet.props";

/** K: the shortcut words. */
const K = UI_KEYS.ui.shortcuts;

/** The scope words. */
const SCOPE = {
  app: K.scope_app,
  page: K.scope_page,
  overlay: K.scope_overlay,
  focus: K.scope_focus,
} as const;

/** The searchable, grouped list of every registered shortcut. */
export function ShortcutCheatSheet({
  isOpen,
  onOpenChange,
  shortcut = STANDARD_SHORTCUTS["shortcuts.cheat_sheet"],
}: ShortcutCheatSheetProps): ReactElement {
  const t = useUiText();
  const { actions, apple } = useShortcutRegistry();
  const [own, setOwn] = useState(false);
  const [query, setQuery] = useState("");
  const open = isOpen ?? own;
  const setOpen = (next: boolean) => {
    setOwn(next);
    onOpenChange?.(next);
    if (!next) setQuery("");
  };
  useShortcutAction(
    shortcut === false || shortcut === undefined
      ? undefined
      : {
          id: "shortcuts.cheat_sheet",
          label: t(K.cheat_sheet),
          shortcut,
          scope: "app",
          run: () => setOpen(!open),
        },
  );
  const needle = normalizeSearchText(query);
  const seen = new Set<string>();
  const rows = actions.filter((action) => {
    // One row per id: two controls bound to the same action list it once.
    if (action.keys === undefined || seen.has(action.id)) return false;
    seen.add(action.id);
    if (needle === "") return true;
    const display = formatShortcutKeys(action.keys, apple);
    return normalizeSearchText(
      `${action.label} ${action.group ?? ""} ${display.spoken} ${display.steps.join(" ")}`,
    ).includes(needle);
  });
  const groups = new Map<string, typeof rows>();
  for (const row of rows) {
    const group = row.group ?? t(SCOPE[row.scope]);
    groups.set(group, [...(groups.get(group) ?? []), row]);
  }
  return (
    <Modal isOpen={open} onOpenChange={setOpen} size="lg" position="top">
      <Modal.Header>
        <Modal.Title>{t(K.cheat_sheet)}</Modal.Title>
      </Modal.Header>
      <Modal.Body className="flex flex-col gap-4">
        <SearchField
          aria-label={t(K.search)}
          placeholder={t(K.search)}
          value={query}
          onChange={setQuery}
          isFullWidth
          // oxlint-disable-next-line jsx-a11y/no-autofocus -- reason: the person opened the sheet to find a shortcut; the search takes the focus
          autoFocus
        />
        {groups.size === 0 ? (
          <p className="m-0 p-6 text-center text-sm text-muted">{t(K.empty)}</p>
        ) : (
          <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto">
            {[...groups].map(([group, items]) => (
              <section key={group} aria-label={group} className="flex flex-col gap-1">
                <h3 className="m-0 text-xs font-medium text-muted">{group}</h3>
                <ul className="m-0 flex list-none flex-col p-0">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-4 border-b border-separator py-2 last:border-b-0"
                    >
                      <span className="text-sm">{item.label}</span>
                      <ShortcutHint keys={item.keys ?? ""} />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
        <p className="m-0 text-xs text-muted">
          {t(K.hold_hint, { modifier: apple ? "⌘" : "Ctrl" })}
        </p>
      </Modal.Body>
    </Modal>
  );
}
