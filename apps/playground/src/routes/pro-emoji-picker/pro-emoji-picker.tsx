/**
 * Stackra file contract:
 * Purpose: the page of the EmojiPicker route: `@stackra/ui-pro`'s EmojiPicker as a button that shows the chosen emoji
 *          and opens a searchable grid of emoji, with the choice reported beside it and an empty state when the search
 *          matches none.
 * Boundary: presentation and local state only. The grid holds a short hand-written list of emoji with names and tags
 *          (HeroUI Pro's docs load a full emoji dataset, which the playground does not carry), and has no skin-tone
 *          picker, since the list has no skin variants.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0060 (light, dark, RTL); STA-416 FR-012.
 */
import { SearchField } from "@heroui/react";
import * as UiPro from "@stackra/ui-pro/react";
import { useState } from "react";

import { ProEmojiPickerRoute } from "#src/routes/pro-emoji-picker/pro-emoji-picker.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::pro-emoji-picker.*` keys.
const STRINGS = {
  documentTitle: `${ProEmojiPickerRoute.title} · Stackra Playground`,
  intro:
    "A button that opens a grid of emoji. Open it, type to search by name, move with the arrow keys and press Enter or choose an emoji.",
  picker: "Reaction",
  label: "Choose an emoji",
  search: "Search emoji",
  placeholder: "Search emoji...",
  empty: "No emoji found.",
  chosen: (emoji: string, name: string) => `Chosen: ${emoji} ${name}`,
} as const;

/** One emoji of the grid. */
interface Emoji {
  readonly id: string;
  readonly name: string;
  readonly tags: string;
}

const EMOJI: readonly Emoji[] = [
  { id: "😀", name: "grinning face", tags: "smile happy" },
  { id: "😂", name: "face with tears of joy", tags: "laugh lol" },
  { id: "😍", name: "smiling face with heart eyes", tags: "love" },
  { id: "🤔", name: "thinking face", tags: "hmm consider" },
  { id: "😢", name: "crying face", tags: "sad tear" },
  { id: "😎", name: "smiling face with sunglasses", tags: "cool" },
  { id: "👍", name: "thumbs up", tags: "yes approve" },
  { id: "👏", name: "clapping hands", tags: "applause bravo" },
  { id: "🙏", name: "folded hands", tags: "thanks please" },
  { id: "💪", name: "flexed biceps", tags: "strong" },
  { id: "❤️", name: "red heart", tags: "love" },
  { id: "🔥", name: "fire", tags: "hot lit" },
  { id: "🎉", name: "party popper", tags: "celebrate" },
  { id: "🚀", name: "rocket", tags: "launch ship" },
  { id: "⭐", name: "star", tags: "favorite" },
  { id: "✅", name: "check mark", tags: "done yes" },
  { id: "🌈", name: "rainbow", tags: "weather" },
  { id: "☕", name: "hot beverage", tags: "coffee tea" },
  { id: "🍕", name: "pizza", tags: "food" },
  { id: "🐶", name: "dog face", tags: "pet animal" },
  { id: "🐱", name: "cat face", tags: "pet animal" },
  { id: "🌱", name: "seedling", tags: "plant grow" },
  { id: "💡", name: "light bulb", tags: "idea" },
  { id: "🎯", name: "bullseye", tags: "target goal" },
];

/** The EmojiPicker page. */
export function ProEmojiPicker() {
  const [value, setValue] = useState<string>("😀");
  const name = EMOJI.find((emoji) => emoji.id === value)?.name ?? "";

  return (
    <article className="grid gap-6">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <h1 className="type-h1">{ProEmojiPickerRoute.title}</h1>
        <p className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </p>
      </header>
      <section aria-labelledby="picker-heading" className="grid gap-3">
        <h2 id="picker-heading" className="type-h2">
          {STRINGS.picker}
        </h2>
        <div>
          <UiPro.EmojiPicker
            label={STRINGS.label}
            value={value}
            onChange={(key) => setValue(String(key))}
          >
            <UiPro.EmojiPicker.Trigger className="text-xl">
              <UiPro.EmojiPicker.Value />
            </UiPro.EmojiPicker.Trigger>
            <UiPro.EmojiPicker.Popover>
              <UiPro.EmojiPicker.Content>
                <SearchField aria-label={STRINGS.search} variant="secondary">
                  <SearchField.Group>
                    <SearchField.SearchIcon />
                    <SearchField.Input placeholder={STRINGS.placeholder} />
                  </SearchField.Group>
                </SearchField>
                <UiPro.EmojiPicker.Grid
                  items={EMOJI}
                  renderEmptyState={() => (
                    <p className="flex h-full min-h-20 items-center justify-center text-sm">
                      <bdi>{STRINGS.empty}</bdi>
                    </p>
                  )}
                >
                  {(emoji) => (
                    <UiPro.EmojiPicker.Item
                      id={emoji.id}
                      textValue={`${emoji.name} ${emoji.tags}`}
                      aria-label={emoji.name}
                    >
                      {emoji.id}
                    </UiPro.EmojiPicker.Item>
                  )}
                </UiPro.EmojiPicker.Grid>
              </UiPro.EmojiPicker.Content>
            </UiPro.EmojiPicker.Popover>
          </UiPro.EmojiPicker>
        </div>
        <p role="status">
          <bdi>{STRINGS.chosen(value, name)}</bdi>
        </p>
      </section>
    </article>
  );
}
