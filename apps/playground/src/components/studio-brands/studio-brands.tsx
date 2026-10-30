/**
 * Stackra file contract:
 * Purpose: the Theme Studio's brand picker: every approved brand layer as a choice showing its accent and its name
 *          in its own display face. Picking one redraws the whole showcase in it (colours, radius, shadows, motion
 *          and faces) and starts the studio from it.
 * Boundary: the picker only; the page applies the brand (`applyBrandTheme`) inside the picked transition. The
 *           choices are native radio inputs, so the group is one tab stop with arrow keys.
 * Runtime: browser
 * Governing contract: ADR 0340 (decision 2); WCAG 2.2 SC 1.3.1, 2.4.7, 4.1.2.
 */
import { Heading, useCatalogueText } from "@stackra/ui/react";
import { type CSSProperties, useId } from "react";

import { BRAND_THEMES } from "#src/constants/brand-themes";
import { MESSAGES } from "#src/constants/messages.constant";
import { THEME_STUDIO_KEYS } from "#src/routes/theme-studio/theme-studio-keys.constant";

import { brandThemeOf } from "./brand-theme-of.function";
import type { StudioBrandsProps } from "./studio-brands.props";

/** The picker's keys. */
const K = THEME_STUDIO_KEYS.theme_studio.brands;

/** The studio's brand picker. */
export function StudioBrands({ value, onChange }: StudioBrandsProps) {
  const t = useCatalogueText(MESSAGES.en);
  const name = useId();
  return (
    <section aria-labelledby={`${name}-title`} className="grid gap-3">
      <Heading id={`${name}-title`} level={3} className="sr-only">
        {t(K.title)}
      </Heading>
      <div role="radiogroup" aria-labelledby={`${name}-title`} className="grid grid-cols-2 gap-2">
        {BRAND_THEMES.map((brand) => {
          const accent = brandThemeOf(brand).colors.accent;
          return (
            <label
              key={brand.id}
              className="flex cursor-pointer items-center gap-2 border border-separator p-2 text-sm has-checked:border-accent has-checked:bg-default has-focus-visible:outline-2 has-focus-visible:outline-focus"
              style={{ borderRadius: "var(--radius-lg)" }}
            >
              <input
                type="radio"
                name={name}
                value={brand.id}
                checked={brand.id === value.id}
                onChange={() => onChange(brand)}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className="size-4 shrink-0 border border-separator bg-[var(--swatch)] dark:bg-[var(--swatch-dark)]"
                style={
                  {
                    borderRadius: "var(--radius-full)",
                    "--swatch": accent.light,
                    "--swatch-dark": accent.dark,
                  } as CSSProperties
                }
              />
              <span
                className="min-w-0 truncate font-semibold rtl:hidden"
                style={{ fontFamily: `"${brand.display}", var(--font-sans)` }}
              >
                {brand.name.en}
              </span>
              <span
                lang="ar"
                className="min-w-0 truncate font-semibold ltr:hidden"
                style={{ fontFamily: `"${brand.displayArabic}", var(--font-arabic)` }}
              >
                {brand.name.ar}
              </span>
            </label>
          );
        })}
      </div>
    </section>
  );
}
