/**
 * Stackra file contract:
 * Purpose: `HeroActions`, the ways in every landing hero offers under its pitch: browse the components, open the Theme
 *          Studio, a hero's own control, and the count of built components as a chip beside them (the header's search,
 *          ⌘K, finds a component, so the hero has no search of its own).
 * Boundary: navigation keeps the search params (scheme, locale).
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 3.2 (Home); STA-1371.
 */
import { categoryPath, COMPONENTS } from "@stackra/showcase";
import { Button, Chip, Icon, useCatalogueText } from "@stackra/ui/react";
import { useLocation, useNavigate } from "react-router";

import { BRAND_KEYS } from "#src/constants/brand-keys.constant";
import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { SHOWCASE_KEYS } from "#src/constants/showcase-keys.constant";

import type { HeroActionsProps } from "./hero-actions.props";

/** The built entries (planned ones are registered gaps, not components to count). */
const BUILT = COMPONENTS.filter((entry) => entry.status !== "planned");

/** The hero's buttons and the component count. */
export function HeroActions({ children }: HeroActionsProps) {
  const t = useCatalogueText(MESSAGES.en);
  const navigate = useNavigate();
  const { search } = useLocation();
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        variant="primary"
        endIcon={<Icon name={Icons.ArrowRight} isMirroredInRtl />}
        onPress={() => void navigate(`${categoryPath()}${search}`)}
      >
        {t(BRAND_KEYS.brand.browse)}
      </Button>
      <Button
        variant="outline"
        startIcon={Icons.Palette}
        onPress={() => void navigate(`/theme-studio${search}`)}
      >
        {t(BRAND_KEYS.brand.theme)}
      </Button>
      {children}
      <Chip variant="soft" startIcon={Icons.LayoutGrid}>
        <bdi>{t(SHOWCASE_KEYS.showcase.ui.count_components, { count: BUILT.length })}</bdi>
      </Chip>
    </div>
  );
}
