/**
 * Stackra file contract:
 * Purpose: the web `CommandPalette`: a modal with a search field over a sectioned list of commands, opened with Cmd+K
 *          or Ctrl+K (or by the app), where arrow keys move through the matches while typing and Enter runs one.
 * Boundary: React Aria's Autocomplete wires the field to the HeroUI list (virtual focus); matching is
 *           `filterCommands` (case, accents and Arabic diacritics folded). The palette closes after a command runs.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (web); WCAG 2.2 SC 2.1.1 and 4.1.2; STA-1371.
 */
import { Header, Kbd, ListBox } from "@heroui/react";
import { type ReactElement, useEffect, useState } from "react";
import { Autocomplete } from "react-aria-components";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { filterCommands } from "#core/functions/filter-commands.function";
import type { CommandPaletteProps } from "#react/command-palette/command-palette.props";
import { useUiText } from "#react/hooks/use-ui-text";
import { Icon } from "#react/icon/icon";
import { Modal } from "#react/modal/modal";
import { SearchField } from "#react/search-field/search-field";

/** K: the palette's words. */
const K = UI_KEYS.ui.command_palette;

/** A search-first list of commands. */
export function CommandPalette({
  sections,
  onAction,
  placeholder,
  hotkey = "k",
  isOpen,
  defaultOpen = false,
  onOpenChange,
}: CommandPaletteProps): ReactElement {
  const t = useUiText();
  const [own, setOwn] = useState(defaultOpen);
  const [query, setQuery] = useState("");
  const open = isOpen ?? own;
  const setOpen = (next: boolean) => {
    setOwn(next);
    onOpenChange?.(next);
    if (!next) setQuery("");
  };
  useEffect(() => {
    if (hotkey === false) return;
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === hotkey) {
        event.preventDefault();
        setOpen(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
  const shown = filterCommands(sections, query);
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
              setOpen(false);
              onAction(String(key));
            }}
            renderEmptyState={() => (
              <p className="m-0 p-6 text-center text-sm text-muted">{t(K.empty)}</p>
            )}
          >
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
                    {item.shortcut ? (
                      <Kbd>
                        <Kbd.Content>{item.shortcut}</Kbd.Content>
                      </Kbd>
                    ) : null}
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
