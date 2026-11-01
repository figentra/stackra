/**
 * Stackra file contract:
 * Purpose: the web `CommandPalette`: a modal with a search field over a sectioned list of commands, opened with Cmd+K
 *          or Ctrl+K (or by the app), where arrow keys move through the matches while typing and Enter runs one. Its
 *          key is registered with the shortcut registry (remappable), and an "Actions" section lists every action the
 *          registry holds with its keys and runs it (ADR 0508).
 * Boundary: React Aria's Autocomplete wires the field to the HeroUI list (virtual focus); matching is
 *           `filterCommands` (case, accents and Arabic diacritics folded). The palette closes after a command runs.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (web); WCAG 2.2 SC 2.1.1 and 4.1.2; STA-1371.
 */
import { Header, ListBox } from "@heroui/react";
import { STANDARD_SHORTCUTS } from "@stackra/shortcuts";
import { useShortcutAction, useShortcutRegistry } from "@stackra/shortcuts/react";
import { type ReactElement, useState } from "react";
import { Autocomplete } from "react-aria-components";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { filterCommands } from "#core/functions/filter-commands.function";
import type { CommandPaletteProps } from "#react/command-palette/command-palette.props";
import { useUiText } from "#react/hooks/use-ui-text";
import { Icon } from "#react/icon/icon";
import { Modal } from "#react/modal/modal";
import { SearchField } from "#react/search-field/search-field";
import { ShortcutHint } from "#react/shortcut-hint/shortcut-hint";
import { TAMO_KEYS } from "#core/constants/tamo-keys.constant";
import { useTamo } from "#react/hooks/use-tamo";
import { TamoMark } from "#react/tamo-mark/tamo-mark";

/** The key of the "Ask Tamo" entry. */
const TAMO_ITEM = "tamo:ask";

/** K: the palette's words. */
const K = UI_KEYS.ui.command_palette;

/** Ids of the registry's actions in the list, kept apart from the app's command ids. */
const REGISTERED = "shortcut:";

/** A search-first list of commands. */
export function CommandPalette({
  sections,
  onAction,
  placeholder,
  hotkey = "k",
  hasRegisteredActions = true,
  isOpen,
  defaultOpen = false,
  onOpenChange,
  ai,
}: CommandPaletteProps): ReactElement {
  const t = useUiText();
  const tamo = useTamo({}, ai !== false);
  const [own, setOwn] = useState(defaultOpen);
  const [query, setQuery] = useState("");
  const open = isOpen ?? own;
  const setOpen = (next: boolean) => {
    setOwn(next);
    onOpenChange?.(next);
    if (!next) setQuery("");
  };
  const registry = useShortcutRegistry();
  useShortcutAction(
    hotkey === false
      ? undefined
      : {
          id: "palette.open",
          label: t(K.label),
          shortcut:
            hotkey === "k"
              ? STANDARD_SHORTCUTS["palette.open"]
              : hotkey.length === 1
                ? `mod+${hotkey}`
                : hotkey,
          scope: "app",
          run: () => setOpen(!open),
        },
  );
  const registered = hasRegisteredActions
    ? [
        {
          id: REGISTERED,
          title: t(K.actions),
          items: registry.actions
            .filter(
              (action, index, all) =>
                action.id !== "palette.open" &&
                all.findIndex((one) => one.id === action.id) === index,
            )
            .map((action) => ({
              id: `${REGISTERED}${action.id}`,
              label: action.label,
              ...(action.icon === undefined ? {} : { icon: action.icon }),
              ...(action.keys === undefined ? {} : { shortcut: action.keys }),
            })),
        },
      ]
    : [];
  const shown = filterCommands(
    [...sections, ...registered].filter((section) => section.items.length > 0),
    query,
  );
  return (
    <Modal isOpen={open} onOpenChange={setOpen} position="top" label={t(K.label)}>
      <Modal.Body className="p-0">
        <Autocomplete inputValue={query} onInputChange={setQuery}>
          <div className="border-b border-separator p-3">
            <SearchField
              aria-label={t(K.label)}
              placeholder={placeholder ?? t(K.placeholder)}
              // oxlint-disable-next-line jsx-a11y/no-autofocus -- reason: the palette opens as a modal the user just asked for; its search field takes the focus
              autoFocus
              isFullWidth
            />
          </div>
          <ListBox
            aria-label={t(K.label)}
            className="max-h-[50vh] overflow-y-auto p-2"
            onAction={(key) => {
              const question = query.trim();
              setOpen(false);
              const id = String(key);
              if (id === TAMO_ITEM) tamo?.panel.open(question === "" ? undefined : question);
              else if (id.startsWith(REGISTERED)) registry.run(id.slice(REGISTERED.length));
              else onAction(id);
            }}
            renderEmptyState={() => (
              <p className="m-0 p-6 text-center text-sm text-muted">{t(K.empty)}</p>
            )}
          >
            {tamo ? (
              <ListBox.Section id="tamo">
                <Header className="px-2 pt-2 pb-1 text-xs font-medium text-muted">
                  {t(TAMO_KEYS.ui.tamo.name)}
                </Header>
                <ListBox.Item
                  id={TAMO_ITEM}
                  textValue={
                    query.trim() === ""
                      ? t(TAMO_KEYS.ui.tamo.palette_open)
                      : t(TAMO_KEYS.ui.tamo.palette_ask, { query: query.trim() })
                  }
                >
                  <TamoMark size="sm" />
                  <span className="truncate">
                    {query.trim() === ""
                      ? t(TAMO_KEYS.ui.tamo.palette_open)
                      : t(TAMO_KEYS.ui.tamo.palette_ask, { query: query.trim() })}
                  </span>
                </ListBox.Item>
              </ListBox.Section>
            ) : null}
            {shown.map((section) => (
              <ListBox.Section key={section.id} id={section.id}>
                <Header className="px-2 pt-2 pb-1 text-xs font-medium text-muted">
                  {section.title}
                </Header>
                {section.items.map((item) => (
                  <ListBox.Item key={item.id} id={item.id} textValue={item.label}>
                    {item.icon ? <Icon name={item.icon} size="sm" tone="muted" /> : null}
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate">{item.label}</span>
                      {item.description ? (
                        <span className="truncate text-xs text-muted">{item.description}</span>
                      ) : null}
                    </div>
                    {item.shortcut ? <ShortcutHint keys={item.shortcut} /> : null}
                  </ListBox.Item>
                ))}
              </ListBox.Section>
            ))}
          </ListBox>
        </Autocomplete>
      </Modal.Body>
    </Modal>
  );
}
