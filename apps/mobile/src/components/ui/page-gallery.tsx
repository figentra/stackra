/**
 * Stackra file contract:
 * Purpose: the design-system landing's gallery, the native twin of the web playground's `page-gallery`: an All / Free
 *          / Pro filter, then one solid panel per category (in `ComponentCategory` order), each with its brand glyph,
 *          its name, its page count and a line on what it holds, listing its pages as rows (a monogram, the title, a
 *          "Pro" badge on Pro pages and a chevron), Free pages first.
 * Boundary: layout, the filter and the row presses only; the pages come in gallery order from the caller, which also
 *          opens a page. A category with no page in the chosen tier is left out; one with no glyph or note below
 *          still lists, with the module glyph and no note.
 * Runtime: react-native
 * Governing contract: ADR 0320 (glass and the showcase stage); ADR 0310 (decision 6); the catalogue taxonomy.
 */
import { Chip, Heading, Icon, Surface, Text } from "@stackra/ui/native";
import { useThemeColor } from "heroui-native";
import { useState } from "react";
import { Pressable, View } from "react-native";

import { ComponentCategory } from "#src/enums/component-category.enum";
import { ComponentTier } from "#src/enums/component-tier.enum";
import { BrandGlyph } from "./brand-glyph";
import type { BrandGlyphName } from "./brand-glyph-name.type";
import { ChoiceGroup } from "./choice-group";
import type { PageGalleryProps } from "#src/components/ui/page-gallery.props";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  tier: "Show",
  names: { All: "All", Free: "Free", Pro: "Pro" },
  pro: "Pro",
  count: (count: number) => (count === 1 ? "1 page" : `${count} pages`),
  none: "No page in this tier yet.",
} as const;

/** The brand glyph each category wears (the web gallery's); a category missing here wears the module glyph. */
const CATEGORY_GLYPHS: Readonly<Partial<Record<ComponentCategory, BrandGlyphName>>> = {
  Foundations: "token",
  Actions: "pipeline",
  "Inputs and forms": "terminal",
  Selection: "check",
  "Date and time": "schema",
  Charts: "graph",
  "Data display": "module",
  "Feedback and status": "alert",
  Navigation: "link",
  Overlays: "package",
  Layout: "menu",
  AI: "pipeline",
};

/** One line per category on what it holds (the web gallery's); a category missing here lists without one. */
const CATEGORY_NOTES: Readonly<Partial<Record<ComponentCategory, string>>> = {
  Foundations:
    "Colour, type, spacing, radius and motion: the tokens every component is drawn from.",
  Actions: "Buttons and links that start something.",
  "Inputs and forms": "Fields, groups and whole forms with validation.",
  Selection: "Checkboxes, radios, switches, selects and tags.",
  "Date and time": "Calendars, pickers and agendas.",
  Charts: "Area, bar, line, pie and radial charts on the theme's colours.",
  "Data display": "Avatars, badges, cards, chips, grids and lists.",
  "Feedback and status": "Spinners, skeletons, ratings and the states that say what is happening.",
  Navigation: "Links, breadcrumbs, tabs and the ways between pages.",
  Overlays: "Dialogs, drawers, popovers, menus and tooltips.",
  Layout: "Surfaces, separators and resizable panes.",
  AI: "Conversations, prompts, sources and streamed text.",
};

/** The filter's choices: every tier, or one. */
type TierFilter = "All" | ComponentTier;

const TIER_FILTERS = (["All", ...ComponentTier] as const).map((value) => ({
  value,
  label: STRINGS.names[value],
}));

/** The two-letter mark a row wears: the initials of a two-word title (`IconButton`: IB), else its first two letters. */
function monogram(title: string) {
  const words = title.match(/[A-Z][a-z0-9]*/g) ?? [title];
  return (words.length > 1 ? `${words[0]?.[0]}${words[1]?.[0]}` : title.slice(0, 2)).toUpperCase();
}

/** The gallery of pages by category. */
export function PageGallery({ pages, onOpen }: PageGalleryProps) {
  const [tier, setTier] = useState<TierFilter>("All");
  const accentForeground = useThemeColor("accent-foreground");
  const shown = tier === "All" ? pages : pages.filter((page) => page.tier === tier);

  return (
    <View className="gap-4">
      <ChoiceGroup label={STRINGS.tier} choices={TIER_FILTERS} value={tier} onChange={setTier} />
      {shown.length === 0 ? <Text tone="muted">{STRINGS.none}</Text> : null}
      {ComponentCategory.map((category) => {
        const inCategory = shown.filter((page) => page.category === category);
        if (inCategory.length === 0) return null;
        const note = CATEGORY_NOTES[category];
        return (
          <Surface key={category} className="gap-3 rounded-3xl p-4">
            <View className="gap-1 px-2 pt-1">
              <View className="flex-row items-center gap-4">
                <View className="size-10 items-center justify-center rounded-xl bg-accent">
                  <BrandGlyph
                    name={CATEGORY_GLYPHS[category] ?? "module"}
                    color={accentForeground}
                    size={20}
                  />
                </View>
                <View className="flex-1">
                  <Heading level={3} type="h4">
                    {category}
                  </Heading>
                </View>
                <Text type="caption" tone="muted" className="font-mono">
                  {STRINGS.count(inCategory.length)}
                </Text>
              </View>
              {note ? (
                <Text type="small" tone="muted">
                  {note}
                </Text>
              ) : null}
            </View>
            <View>
              {inCategory.map(({ route, title, tier: pageTier }) => (
                <Pressable
                  key={route}
                  accessibilityRole="button"
                  accessibilityLabel={pageTier === "Pro" ? `${title}, ${STRINGS.pro}` : title}
                  onPress={() => onOpen(route)}
                  className="flex-row items-center gap-3 rounded-2xl p-2 active:bg-default"
                >
                  <View className="size-9 items-center justify-center rounded-xl border border-border bg-surface-secondary">
                    <Text type="caption" className="font-mono font-semibold">
                      {monogram(title)}
                    </Text>
                  </View>
                  <Text className="flex-1 font-medium">{title}</Text>
                  {pageTier === "Pro" ? (
                    <View>
                      <Chip size="sm" variant="soft" tone="accent">
                        {STRINGS.pro}
                      </Chip>
                    </View>
                  ) : null}
                  <Icon name="chevron-right" size="sm" tone="muted" isMirroredInRtl />
                </Pressable>
              ))}
            </View>
          </Surface>
        );
      })}
    </View>
  );
}
