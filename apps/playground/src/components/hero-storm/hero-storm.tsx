/**
 * Stackra file contract:
 * Purpose: `HeroStorm`, landing hero B, "the theme storm": the headline "One system. Every brand." and a grid of real
 *          @stackra/ui components (`StormTiles`), the whole hero drawn in one brand layer at a time (`STORM_THEMES`)
 *          and re-themed every 3.2 seconds: colours, radius and type ease into the next theme behind a sweep of its
 *          accent. Pills pick a theme (and stop the turn); a button pauses and plays it.
 * Boundary: the theme's custom properties (`themeVariables` of the layer, for its scheme) are set inline on the hero
 *           only, as the Theme Studio's canvas does, so the rest of the page keeps its own. Reduced motion never turns
 *           on its own and draws a pick at once.
 * Runtime: browser
 * Governing contract: owner decision 2026-10-28 (hero concept B); ADR 0340 (decision 2); STA-1371; WCAG 2.2 SC 2.2.2,
 *          2.3.3, 4.1.2.
 */
import { themeVariables } from "@stackra/tokens";
import {
  Button,
  Text,
  ToggleButton,
  ToggleButtonGroup,
  useCatalogueText,
  useDesignSystem,
} from "@stackra/ui/react";
import { motion, useReducedMotion } from "motion/react";
import { type CSSProperties, useEffect, useState } from "react";

import { HeroActions } from "#src/components/landing-hero";
import { SHELL_KEYS } from "#src/components/playground-shell/shell-keys.constant";
import { brandThemeOf } from "#src/components/studio-brands";
import { BRAND_THEMES } from "#src/constants/brand-themes";
import { BRAND_KEYS } from "#src/constants/brand-keys.constant";
import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";

import { STORM_THEMES } from "./storm-themes.constant";
import { StormTiles } from "./storm-tiles";

/** The storm hero's keys. */
const K = BRAND_KEYS.brand.hero.storm;

/** How long each theme stays, in ms. */
const TURN = 3200;

/** The brand layer of each storm theme, with the scheme it is drawn in. */
const THEMES = STORM_THEMES.flatMap(({ brand, scheme }) => {
  const layer = BRAND_THEMES.find(({ id }) => id === brand);
  return layer ? [{ layer, scheme }] : [];
});

/** Hero B: the theme storm. */
export function HeroStorm() {
  const t = useCatalogueText(MESSAGES.en);
  const { resolvedColorScheme, locale } = useDesignSystem();
  const isStill = useReducedMotion() ?? false;
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const isTurning = isPlaying && !isStill;
  const language = locale.startsWith("ar") ? "ar" : "en";

  useEffect(() => {
    if (!isTurning) return undefined;
    const timer = setInterval(() => setIndex((at) => (at + 1) % THEMES.length), TURN);
    return () => clearInterval(timer);
  }, [isTurning]);

  const current = THEMES[index] ?? THEMES[0];
  if (!current) return null;
  const scheme = current.scheme ?? resolvedColorScheme;
  const { heroui, stackra } = themeVariables(brandThemeOf(current.layer));
  const sheet = {
    ...heroui.root,
    ...stackra.root,
    ...heroui[scheme],
    ...stackra[scheme],
    "--font-display": `"${current.layer.display}", var(--font-sans)`,
    "--font-display-arabic": `"${current.layer.displayArabic}", var(--font-arabic)`,
    colorScheme: scheme,
  } as CSSProperties;
  const name = current.layer.name[language];
  const lines = [t(K.title), t(K.title_accent)];

  return (
    <section
      aria-labelledby="hero-title"
      data-theme={scheme}
      style={sheet}
      className={`hero-storm relative isolate grid gap-10 overflow-hidden hero-panel border border-border bg-background p-5 text-foreground sm:p-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:p-12 ${scheme === "dark" ? "dark" : ""}`}
    >
      <title>{`${lines.join(" ")} · ${t(SHELL_KEYS.shell.title)}`}</title>
      {isTurning ? (
        // A sweep of the new accent crosses the hero as it re-themes (a flat tint shaped by a mask, under the content).
        <motion.span
          key={index}
          aria-hidden="true"
          className="pointer-events-none absolute -inset-y-1/5 -inset-x-3/5 -z-10 bg-accent [mask-image:linear-gradient(100deg,transparent_40%,black_50%,transparent_60%)]"
          initial={{ x: "-60%", opacity: 0.2 }}
          animate={{ x: "60%", opacity: 0 }}
          transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
        />
      ) : null}
      <div className="@container grid content-start justify-items-start gap-6">
        <p className="hero-eyebrow text-muted">{t(K.eyebrow, { name })}</p>
        <h1 id="hero-title" className="hero-headline">
          {lines[0]} <span className="block text-[var(--link)]">{lines[1]}</span>
        </h1>
        <Text tone="muted" className="max-w-md text-lg text-pretty">
          {t(K.pitch)}
        </Text>
        <div className="grid w-full gap-3">
          <ToggleButtonGroup
            aria-label={t(K.themes)}
            size="sm"
            selectionMode="single"
            disallowEmptySelection
            selectedKeys={[current.layer.id]}
            isDetached
            className="flex-wrap justify-start"
            onSelectionChange={(keys) => {
              const picked = THEMES.findIndex(({ layer }) => keys.has(layer.id));
              if (picked < 0) return;
              setIndex(picked);
              setIsPlaying(false);
            }}
          >
            {THEMES.map(({ layer, scheme: drawn }) => (
              <ToggleButton key={layer.id} id={layer.id}>
                <span
                  aria-hidden="true"
                  className="size-3 hero-round border border-border"
                  style={{
                    background: brandThemeOf(layer).colors.accent[drawn ?? resolvedColorScheme],
                  }}
                />
                {layer.name[language]}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          <div
            aria-hidden="true"
            className="h-0.5 w-full max-w-80 overflow-hidden hero-round bg-separator"
          >
            {isTurning ? (
              <motion.div
                key={index}
                className="hero-progress h-full bg-accent"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: TURN / 1000, ease: "linear" }}
              />
            ) : null}
          </div>
        </div>
        <HeroActions>
          {isStill ? null : (
            <Button
              variant="secondary"
              startIcon={isPlaying ? Icons.Pause : Icons.Play}
              onPress={() => setIsPlaying((was) => !was)}
            >
              {t(isPlaying ? BRAND_KEYS.brand.hero.pause : K.play)}
            </Button>
          )}
        </HeroActions>
      </div>
      <StormTiles isStill={isStill} />
    </section>
  );
}
