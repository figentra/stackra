/**
 * Stackra file contract:
 * Purpose: the category tabs of the showcase home: "All" then the thirteen categories as one scrolling row of
 *          @stackra/ui `Tabs` (the Tabs play the selection haptic and mirror in RTL).
 * Boundary: the tab row only; the home owns the selected page and `CategoryPager` draws it. The titles are
 *           `showcase::category.<id>.title` keys.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) sections 3.1 and 3.3; ADR 0461 (core shows free only).
 */
import type { I18nKey } from "@stackra/i18n";
import { CATEGORIES, categoryKeys } from "@stackra/showcase";
import { Tabs, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { HOME_KEYS } from "#src/constants/home-keys.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { ALL_PAGE } from "./all-page.constant";
import type { CategoryTabsProps } from "./category-tabs.props";

/** The showcase chrome's keys. */
const K = HOME_KEYS.showcase;

/** The scrolling row of category tabs. */
export function CategoryTabs({ label, page, onPageChange }: CategoryTabsProps) {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="px-4">
      <Tabs
        label={label}
        items={[
          { id: ALL_PAGE, label: t(K.ui.all), content: null },
          ...CATEGORIES.map((category) => ({
            id: category.id,
            label: t(categoryKeys(category.id).title as I18nKey),
            content: null,
          })),
        ]}
        selectedKeys={[page]}
        onSelectionChange={([next]) => {
          if (next !== undefined) onPageChange(next);
        }}
      />
    </View>
  );
}
