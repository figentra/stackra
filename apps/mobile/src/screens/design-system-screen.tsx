/**
 * Stackra file contract:
 * Purpose: the index of the design-system review area, the mobile twin of the web playground: the colour scheme and
 *          the language and direction switchers, which drive `useDesignSystem()`, an All / Free / Pro filter, and the
 *          component list in one section per category (the owner's catalogue order), each row opening that
 *          component's page. Inside a section the Free rows come first, then the Pro ones, each alphabetical; a Pro
 *          row carries a "Pro" badge. A category with no row to show is hidden.
 * Boundary: presentation and navigation calls; the categories come from `ComponentCategory`, the rows from
 *          `design-system-components.ts`, the display state from the design system provider; the filter is local.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6); ADR 0302 (decision 5); ADR 0060 (light, dark, RTL); STA-403 FR-013.
 */
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ColorScheme } from "@stackra/ui/contracts";
import { Chip, useDesignSystem } from "@stackra/ui/native";
import { ListGroup } from "heroui-native";
import { useState } from "react";

import { ChoiceGroup } from "../components/ui/choice-group";
import { Screen } from "../components/ui/screen";
import { Section } from "../components/ui/section";
import { ComponentCategory } from "../enums/component-category.enum";
import { ComponentTier } from "../enums/component-tier.enum";
import type { DesignSystemComponentRoute, SettingsStackParamList } from "../navigation/types";
import { DESIGN_SYSTEM_COMPONENTS } from "./design-system-components";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  display: {
    title: "Display",
    description:
      "Every page below follows the colour scheme and the language, so each component can be checked in each " +
      "combination. The tier filter only narrows this list.",
  },
  scheme: {
    label: "Colour scheme",
    names: { light: "Light", dark: "Dark", system: "System" },
  },
  language: {
    label: "Language and direction",
    english: "English (LTR)",
    arabic: "العربية (RTL)",
  },
  tier: {
    label: "Components",
    names: { All: "All", Free: "Free", Pro: "Pro" },
  },
  proBadge: "Pro",
} as const;

/** The list filter: every component, or one tier. */
type TierFilter = "All" | ComponentTier;

const SCHEMES = ColorScheme.map((scheme) => ({
  value: scheme,
  label: STRINGS.scheme.names[scheme],
}));

const LANGUAGES = [
  { value: "en", label: STRINGS.language.english },
  { value: "ar", label: STRINGS.language.arabic },
] as const;

const TIER_FILTERS = (["All", ...ComponentTier] as const).map((value) => ({
  value,
  label: STRINGS.tier.names[value],
}));

/** The rows in display order inside a category: Free before Pro, then by title. */
const ROWS = [...DESIGN_SYSTEM_COMPONENTS].sort(
  (a, b) =>
    ComponentTier.indexOf(a.tier) - ComponentTier.indexOf(b.tier) || a.title.localeCompare(b.title),
);

/** The review area's index: display switchers and the tier filter, then one list of components per category. */
export function DesignSystemScreen({
  navigation,
}: NativeStackScreenProps<SettingsStackParamList, "DesignSystem">) {
  const { colorScheme, setColorScheme, locale, setLocale } = useDesignSystem();
  const [tier, setTier] = useState<TierFilter>("All");
  // Every component route takes no params, but navigate's per-route overloads cannot take a union of route names,
  // so the call is typed as what it is: open one of these routes with no params.
  const openPage = navigation.navigate as (route: DesignSystemComponentRoute) => void;
  const rows = tier === "All" ? ROWS : ROWS.filter((row) => row.tier === tier);

  return (
    <Screen>
      <Section title={STRINGS.display.title} description={STRINGS.display.description}>
        <ChoiceGroup
          label={STRINGS.scheme.label}
          choices={SCHEMES}
          value={colorScheme}
          onChange={setColorScheme}
        />
        <ChoiceGroup
          label={STRINGS.language.label}
          choices={LANGUAGES}
          value={locale}
          onChange={setLocale}
        />
        <ChoiceGroup
          label={STRINGS.tier.label}
          choices={TIER_FILTERS}
          value={tier}
          onChange={setTier}
        />
      </Section>

      {ComponentCategory.map((category) => {
        const inCategory = rows.filter((row) => row.category === category);
        if (inCategory.length === 0) return null;
        return (
          <Section key={category} title={category}>
            <ListGroup>
              {inCategory.map(({ title, route, tier: rowTier }) => (
                <ListGroup.Item
                  key={route}
                  accessibilityLabel={rowTier === "Pro" ? `${title}, ${STRINGS.proBadge}` : title}
                  onPress={() => openPage(route)}
                >
                  <ListGroup.ItemContent>
                    <ListGroup.ItemTitle>{title}</ListGroup.ItemTitle>
                  </ListGroup.ItemContent>
                  {rowTier === "Pro" ? (
                    <ListGroup.ItemSuffix>
                      <Chip size="sm" tone="accent">
                        {STRINGS.proBadge}
                      </Chip>
                    </ListGroup.ItemSuffix>
                  ) : null}
                  <ListGroup.ItemSuffix />
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Section>
        );
      })}
    </Screen>
  );
}
