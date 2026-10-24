/**
 * Stackra file contract:
 * Purpose: the frame of every design-system page, the native twin of the web playground shell's page chrome: the
 *          category strip above the page and the previous and next pages below it, handed to the page's `Screen`
 *          through `ScreenChrome`, so the 84 pages stay unchanged and keep their solid background (glass frames the
 *          samples and never sits under one). Moving to another page replaces this one, so back always returns to
 *          the gallery; "All components" returns to it too, adding it under a page opened by a deep link.
 * Boundary: the chrome and its navigation calls; the page and the page list come from the stack registration.
 * Runtime: react-native
 * Governing contract: ADR 0320 (glass and the showcase stage); ADR 0310 (decision 6).
 */
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { ReactNode } from "react";

import type { DesignSystemComponentRoute, SettingsStackParamList } from "#src/navigation/types";
import type { PageLink } from "#src/types/page-link.type";
import { CategoryStrip } from "./category-strip";
import { PagePager } from "./page-pager";
import { ScreenChrome } from "./screen";

/** Props of {@link ComponentPage}. */
export interface ComponentPageProps {
  /** Every page, in gallery order. */
  pages: readonly PageLink[];
  /** The route of the page inside. */
  route: DesignSystemComponentRoute;
  /** The component page the frame wraps. */
  children: ReactNode;
}

/** A design-system page with its category strip and pager. */
export function ComponentPage({ pages, route, children }: ComponentPageProps) {
  const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
  const current = pages.find((page) => page.route === route);
  if (!current) return children;
  // Every page route takes no params, but replace's per-route overloads cannot take a union of route names.
  const open = navigation.replace as (route: DesignSystemComponentRoute) => void;
  const chrome = {
    top: (
      <CategoryStrip
        pages={pages}
        current={current}
        onOpen={open}
        onOpenAll={() => navigation.popTo("DesignSystem")}
      />
    ),
    bottom: <PagePager pages={pages} current={current} onOpen={open} />,
  };
  return <ScreenChrome value={chrome}>{children}</ScreenChrome>;
}
