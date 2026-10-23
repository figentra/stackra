/**
 * Stackra file contract:
 * Purpose: the index of the design-system review area, the mobile twin of the web playground: the colour scheme and
 *          the language and direction switchers, which drive `useDesignSystem()`, and the component list grouped
 *          by section, each row opening that component's page.
 * Boundary: presentation and navigation calls; the groups and rows come from `design-system-components.ts`, the
 *          state from the design system provider.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6); ADR 0302 (decision 5); ADR 0060 (light, dark, RTL); STA-403 FR-013.
 */
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ColorScheme } from "@stackra/ui/contracts";
import { useDesignSystem } from "@stackra/ui/native";
import { ListGroup } from "heroui-native";

import { ChoiceGroup } from "../components/ui/choice-group";
import { Screen } from "../components/ui/screen";
import { Section } from "../components/ui/section";
import type { DesignSystemComponentRoute, SettingsStackParamList } from "../navigation/types";
import { DESIGN_SYSTEM_COMPONENTS, type DesignSystemGroup } from "./design-system-components";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  display: {
    title: "Display",
    description:
      "Every page below follows these two choices, so each component can be checked in each combination.",
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
  groups: { Free: "Free", Pro: "Pro" } satisfies Record<DesignSystemGroup, string>,
} as const;

const SCHEMES = ColorScheme.map((scheme) => ({
  value: scheme,
  label: STRINGS.scheme.names[scheme],
}));

const LANGUAGES = [
  { value: "en", label: STRINGS.language.english },
  { value: "ar", label: STRINGS.language.arabic },
] as const;

/** The groups of the list in first-seen order, so a group exists only while it has a component. */
const GROUPS = [...new Set(DESIGN_SYSTEM_COMPONENTS.map(({ group }) => group))];

/** The review area's index: display switchers, then one list of components for each group. */
export function DesignSystemScreen({
  navigation,
}: NativeStackScreenProps<SettingsStackParamList, "DesignSystem">) {
  const { colorScheme, setColorScheme, locale, setLocale } = useDesignSystem();
  // Every component route takes no params, but navigate's per-route overloads cannot take a union of route names,
  // so the call is typed as what it is: open one of these routes with no params.
  const openPage = navigation.navigate as (route: DesignSystemComponentRoute) => void;

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
      </Section>

      {GROUPS.map((group) => (
        <Section key={group} title={STRINGS.groups[group]}>
          <ListGroup>
            {DESIGN_SYSTEM_COMPONENTS.filter((component) => component.group === group).map(
              ({ title, route }) => (
                <ListGroup.Item key={route} onPress={() => openPage(route)}>
                  <ListGroup.ItemContent>
                    <ListGroup.ItemTitle>{title}</ListGroup.ItemTitle>
                  </ListGroup.ItemContent>
                  <ListGroup.ItemSuffix />
                </ListGroup.Item>
              ),
            )}
          </ListGroup>
        </Section>
      ))}
    </Screen>
  );
}
