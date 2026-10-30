/**
 * Stackra file contract:
 * Purpose: `DisplaySettings`, the body of the top bar's Display popover, built from HeroUI's Toolbar,
 *          ToggleButtonGroup and Select as labelled rows in four sections (appearance, language and numbers, motion,
 *          showcase), each control stretched to the popover's width at one height, the current value of an icon or
 *          short control spelled beside its label, and a reset to the defaults at the foot: mode (colour scheme), language, digits (the customer's
 *          numerals setting: Latin by default, Arabic-Indic), brand family, the transition
 *          each change plays (motion), material and the landing hero of this visit (`chooseHero`). The brand and the
 *          transition are `DesignSystemProvider` state
 *          (`useDesignSystem()`); a brand pick redraws the page in it (`applyBrandTheme`) and the transition pick is kept in this browser. The
 *          browser's theme-color is `ThemeColorSync`'s, since the popover unmounts this.
 * Boundary: the switcher only; the provider holds the state, `runThemeTransition` plays the change (a fade under
 *           reduced motion, nothing for `none`).
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0340 (decision 2, brand layers); ADR 0310 (decision 11);
 *          WCAG 2.2 SC 2.3.3, 4.1.2.
 */
import { MaterialMode } from "@stackra/tokens/contracts";
import { ColorScheme, MotionLevel } from "@stackra/ui/contracts";
import {
  Button,
  Icon,
  Select,
  ToggleButton,
  ToggleButtonGroup,
  Toolbar,
  useCatalogueText,
  useDesignSystem,
} from "@stackra/ui/react";

import { chooseHero, useVisitHero } from "#src/components/landing-hero";
import { applyBrandTheme } from "#src/components/studio-brands";
import {
  runThemeTransition,
  THEME_TRANSITION_KEY,
  THEME_TRANSITIONS,
  type ThemeTransitionPreset,
} from "#src/components/theme-transition";
import { BRAND_KEYS } from "#src/constants/brand-keys.constant";
import { BRAND_THEMES, type BrandTheme } from "#src/constants/brand-themes";
import { HEROES } from "#src/constants/heroes.constant";
import { MESSAGES } from "#src/constants/messages.constant";

import { displayField as field } from "./display-field.function";
import { DISPLAY_FOOTER } from "./display-footer.constant";
import { DisplaySection as Section } from "./display-section";
import { LOCALES } from "./display-settings-locales.constant";
import { MATERIAL_ICONS } from "./display-settings-material-icons.constant";
import type { DisplaySettingsProps } from "./display-settings.props";
import { SCHEME_ICONS } from "./display-settings-scheme-icons.constant";
import { SHELL_KEYS } from "./shell-keys.constant";
import { SHOWCASE_NUMERALS } from "./showcase-numerals.constant";

/** The shell's keys. */
const K = SHELL_KEYS.shell;

/** The catalogue key of a transition preset: its id in snake_case. */
const transitionKey = (id: ThemeTransitionPreset) =>
  K.transitions[id.replaceAll("-", "_") as keyof typeof K.transitions];

/** The defaults "Reset to defaults" restores. Language and the landing hero are the reader's, so they stay. */
// shortcut: `material` repeats the shell's DEFAULT_MATERIAL; move both to one constant when the shell is free to edit.
const DEFAULTS = { scheme: "system", material: "glass", numerals: "latn", motion: "full" } as const;

/** A segment of a stretched segmented control: an equal share of its width. */
const SEGMENT = "flex-1";

/** The display switcher. */
export function DisplaySettings({
  material,
  onMaterialChange,
  numerals,
  onNumeralsChange,
}: DisplaySettingsProps) {
  const {
    colorScheme,
    locale,
    brand,
    transition,
    motion,
    setColorScheme,
    setLocale,
    setBrand,
    setTransition,
    setMotion,
  } = useDesignSystem();
  const t = useCatalogueText(MESSAGES.en);
  const preset = THEME_TRANSITIONS.find(({ id }) => id === transition)?.id;
  const play = (update: () => void) => runThemeTransition(update, preset);
  const language = locale.startsWith("ar") ? "ar" : "en";
  const hero = useVisitHero();
  const pickTransition = (id: ThemeTransitionPreset) => {
    try {
      localStorage.setItem(THEME_TRANSITION_KEY, id);
    } catch {
      // shortcut: a browser that refuses storage keeps the pick for this page only.
    }
    setTransition(id);
  };
  const reset = () => {
    const stackra = BRAND_THEMES[0] as BrandTheme;
    pickTransition("circle-origin");
    setMotion(DEFAULTS.motion);
    play(() => {
      setColorScheme(DEFAULTS.scheme);
      onMaterialChange(DEFAULTS.material);
      onNumeralsChange(DEFAULTS.numerals);
      applyBrandTheme(stackra);
      setBrand(stackra.id);
    });
  };

  return (
    <Toolbar aria-label={t(K.settings)} className="block w-full">
      <div className="grid gap-4">
        <Section title={t(K.sections.appearance)}>
          {field(
            t(K.mode),
            <ToggleButtonGroup
              aria-label={t(K.mode)}
              fullWidth
              selectionMode="single"
              disallowEmptySelection
              selectedKeys={[colorScheme]}
              onSelectionChange={(keys) => {
                const picked = ColorScheme.find((scheme) => keys.has(scheme));
                if (picked) play(() => setColorScheme(picked));
              }}
            >
              {ColorScheme.map((scheme) => (
                <ToggleButton
                  key={scheme}
                  id={scheme}
                  aria-label={t(K.scheme[scheme])}
                  className={SEGMENT}
                >
                  <Icon name={SCHEME_ICONS[scheme]} size="sm" />
                </ToggleButton>
              ))}
            </ToggleButtonGroup>,
            t(K.scheme[colorScheme]),
          )}
          {field(
            t(K.material),
            <ToggleButtonGroup
              aria-label={t(K.material)}
              fullWidth
              selectionMode="single"
              disallowEmptySelection
              selectedKeys={[material]}
              onSelectionChange={(keys) => {
                const picked = MaterialMode.find((mode) => keys.has(mode));
                if (picked) play(() => onMaterialChange(picked));
              }}
            >
              {MaterialMode.map((mode) => (
                <ToggleButton
                  key={mode}
                  id={mode}
                  aria-label={t(K.materials[mode])}
                  className={SEGMENT}
                >
                  <Icon name={MATERIAL_ICONS[mode]} size="sm" />
                </ToggleButton>
              ))}
            </ToggleButtonGroup>,
            t(K.materials[material]),
          )}
          {field(
            t(K.brand),
            <Select
              aria-label={t(K.brand)}
              items={BRAND_THEMES.map(({ id, name }) => ({ id, label: name[language] }))}
              value={brand ?? null}
              isFullWidth
              onChange={(id) => {
                const picked = BRAND_THEMES.find((candidate) => candidate.id === id);
                if (picked)
                  play(() => {
                    applyBrandTheme(picked);
                    setBrand(picked.id);
                  });
              }}
            />,
          )}
        </Section>
        <Section title={t(K.sections.language)}>
          {field(
            t(K.lang),
            <ToggleButtonGroup
              aria-label={t(K.lang)}
              fullWidth
              selectionMode="single"
              disallowEmptySelection
              selectedKeys={[locale]}
              onSelectionChange={(keys) => {
                const picked = LOCALES.find(({ id }) => keys.has(id));
                if (picked) play(() => setLocale(picked.id));
              }}
            >
              {LOCALES.map(({ id, short, name, dir }) => (
                <ToggleButton key={id} id={id} aria-label={name} className={SEGMENT}>
                  <span lang={id} dir={dir}>
                    {short}
                  </span>
                </ToggleButton>
              ))}
            </ToggleButtonGroup>,
          )}
          {field(
            t(K.digits),
            <ToggleButtonGroup
              aria-label={t(K.digits)}
              fullWidth
              selectionMode="single"
              disallowEmptySelection
              selectedKeys={[numerals]}
              onSelectionChange={(keys) => {
                const picked = SHOWCASE_NUMERALS.find((system) => keys.has(system));
                if (picked) play(() => onNumeralsChange(picked));
              }}
            >
              {SHOWCASE_NUMERALS.map((system) => (
                <ToggleButton
                  key={system}
                  id={system}
                  aria-label={t(K.numerals[system])}
                  className={SEGMENT}
                >
                  <span dir="ltr">{system === "arab" ? "٠١٢" : "012"}</span>
                </ToggleButton>
              ))}
            </ToggleButtonGroup>,
            t(K.numerals[numerals]),
          )}
        </Section>
        <Section title={t(K.sections.motion)}>
          {field(
            t(K.motion),
            <ToggleButtonGroup
              aria-label={t(K.motion)}
              fullWidth
              selectionMode="single"
              disallowEmptySelection
              selectedKeys={[motion]}
              onSelectionChange={(keys) => {
                const picked = MotionLevel.find((level) => keys.has(level));
                if (picked) setMotion(picked);
              }}
            >
              {MotionLevel.map((level) => (
                <ToggleButton key={level} id={level} className={SEGMENT}>
                  {t(K.motions[level])}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>,
          )}
          {field(
            t(K.transition),
            <Select
              aria-label={t(K.transition)}
              items={THEME_TRANSITIONS.map(({ id }) => ({ id, label: t(transitionKey(id)) }))}
              value={preset ?? null}
              isFullWidth
              onChange={(id) => {
                const picked = THEME_TRANSITIONS.find((candidate) => candidate.id === id);
                if (picked) pickTransition(picked.id);
              }}
            />,
          )}
        </Section>
        <Section title={t(K.sections.showcase)}>
          {field(
            t(BRAND_KEYS.brand.hero.menu),
            <Select
              aria-label={t(BRAND_KEYS.brand.hero.menu)}
              items={HEROES.map(({ id }) => ({
                id,
                label: t(BRAND_KEYS.brand.hero[id as "stack" | "storm" | "mirror"].name),
              }))}
              value={hero}
              isFullWidth
              onChange={(id) => {
                if (typeof id === "string") chooseHero(id);
              }}
            />,
          )}
        </Section>
        <div className={DISPLAY_FOOTER}>
          <Button variant="outline" size="sm" startIcon="rotate-ccw" onPress={reset}>
            {t(K.reset)}
          </Button>
        </div>
      </div>
    </Toolbar>
  );
}
