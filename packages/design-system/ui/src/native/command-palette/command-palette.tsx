/**
 * Stackra file contract:
 * Purpose: the native `CommandPalette`: a full-height modal with a search field over the matching commands in titled
 *          groups; pressing one runs it and closes the palette.
 * Boundary: opened by the app (`isOpen`); no hotkey on touch. Matching is `filterCommands`, the same as on web.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371.
 */
import { type ReactElement, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { filterCommands } from "#core/functions/filter-commands.function";
import { useUiText } from "#react/hooks/use-ui-text";
import type { CommandPaletteProps } from "#native/command-palette/command-palette.props";
import { Icon } from "#native/icon/icon";
import { Modal } from "#native/modal/modal";
import { SearchField } from "#native/search-field/search-field";
import { Text } from "#native/text/text";

/** K: the palette's words. */
const K = UI_KEYS.ui.command_palette;

/** A search-first list of commands. */
export function CommandPalette({
  sections,
  onAction,
  placeholder,
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
  const shown = filterCommands(sections, query);
  return (
    <Modal isOpen={open} onOpenChange={setOpen} position="top" label={t(K.label)}>
      <Modal.Body className="gap-3">
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder={placeholder ?? t(K.placeholder)}
        />
        <ScrollView className="max-h-96" keyboardShouldPersistTaps="handled">
          {shown.length === 0 ? (
            <Text tone="muted" align="center" className="p-6">
              {t(K.empty)}
            </Text>
          ) : (
            shown.map((section) => (
              <View key={section.id} className="gap-1 pb-2">
                <Text
                  type="caption"
                  tone="muted"
                  accessibilityRole="header"
                  className="px-2 pt-2 font-medium"
                >
                  {section.title}
                </Text>
                {section.items.map((item) => (
                  <Pressable
                    key={item.id}
                    accessibilityRole="button"
                    onPress={() => {
                      setOpen(false);
                      onAction(item.id);
                    }}
                    className="flex-row items-center gap-3 rounded-[var(--radius-control)] px-2 py-2.5 active:bg-default/60"
                  >
                    {item.icon ? <Icon name={item.icon} size="sm" tone="muted" /> : null}
                    <View className="flex-1">
                      <Text numberOfLines={1}>{item.label}</Text>
                      {item.description ? (
                        <Text type="caption" tone="muted" numberOfLines={1}>
                          {item.description}
                        </Text>
                      ) : null}
                    </View>
                  </Pressable>
                ))}
              </View>
            ))
          )}
        </ScrollView>
      </Modal.Body>
    </Modal>
  );
}
