/**
 * Stackra file contract:
 * Purpose: the page of the surface route: one Surface per level, surfaces nested three deep, text in each tone on
 *          every level, and a live sample that changes a surface's level, all from `@stackra/ui/react` with real
 *          props.
 * Boundary: presentation only; strings in one `STRINGS` constant until @stackra/i18n. The web surface paints colour
 *          only, so the samples add padding and radius with classes.
 * Runtime: browser
 * Governing contract: ADR 0302 (decisions 3 and 5); ADR 0303 (decision 7); ADR 0304; ADR 0060 (light, dark, RTL).
 */
import { SurfaceVariant } from "@stackra/ui/contracts";
import { Button, Heading, Surface as UiSurface, Text } from "@stackra/ui/react";
import { useState } from "react";

import { PageSection } from "#src/components/page-section";
import { SurfaceRoute } from "#src/routes/surface/surface.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::surface.*` keys.
const STRINGS = {
  documentTitle: `${SurfaceRoute.title} · Stackra Playground`,
  intro:
    "A Surface is a background at one of the theme's surface levels. HeroUI components inside read the level and pick colours that sit on it. The web surface paints colour only: padding and radius are classes at the call site.",
  levels: "Levels",
  levelsNote: "One surface per level. The transparent one draws no background, so it has a border.",
  level: (level: string) => `Level ${level}`,
  levelLine: "Text on this surface.",
  nested: "Nested",
  nestedNote: "Default, then secondary inside it, then tertiary inside that.",
  text: "Text on each level",
  textNote: "Default and muted text on every level, the pairs the theme measures.",
  defaultText: "Default text",
  mutedText: "Muted text",
  live: "Try it",
  liveNote: "Pick a level; the surface below repaints and tells you which one it is.",
  pick: (level: string) => `Use ${level}`,
  current: (level: string) => `This surface is ${level}.`,
} as const;

/** The padding and radius every sample adds, since the web surface has neither. */
const BOX = "rounded-3xl p-6";

/** The list that lays samples out in a wrapping row. */
const ROW = "flex flex-wrap items-center gap-4";

/** The Surface page. */
export function Surface() {
  const [level, setLevel] = useState<SurfaceVariant>("secondary");

  return (
    <article className="grid gap-10">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <Heading level={1}>{SurfaceRoute.title}</Heading>
        <Text className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </Text>
      </header>

      <PageSection id="surface-levels" title={STRINGS.levels} note={STRINGS.levelsNote}>
        <div className="grid gap-4 sm:grid-cols-2">
          {SurfaceVariant.map((variant) => (
            <UiSurface
              key={variant}
              variant={variant}
              className={variant === "transparent" ? `${BOX} border border-border` : BOX}
            >
              <Text>{STRINGS.level(variant)}</Text>
              <Text type="small" tone="muted">
                <bdi>{STRINGS.levelLine}</bdi>
              </Text>
            </UiSurface>
          ))}
        </div>
      </PageSection>

      <PageSection id="surface-nested" title={STRINGS.nested} note={STRINGS.nestedNote}>
        <UiSurface variant="default" className={BOX}>
          <Text>{STRINGS.level("default")}</Text>
          <UiSurface variant="secondary" className={`${BOX} mt-4`}>
            <Text>{STRINGS.level("secondary")}</Text>
            <UiSurface variant="tertiary" className={`${BOX} mt-4`}>
              <Text>{STRINGS.level("tertiary")}</Text>
            </UiSurface>
          </UiSurface>
        </UiSurface>
      </PageSection>

      <PageSection id="surface-text" title={STRINGS.text} note={STRINGS.textNote}>
        <div className={ROW}>
          {SurfaceVariant.filter((variant) => variant !== "transparent").map((variant) => (
            <UiSurface key={variant} variant={variant} className={BOX}>
              <Text>
                <bdi>{STRINGS.defaultText}</bdi>
              </Text>
              <Text tone="muted">
                <bdi>{STRINGS.mutedText}</bdi>
              </Text>
            </UiSurface>
          ))}
        </div>
      </PageSection>

      <PageSection id="surface-live" title={STRINGS.live} note={STRINGS.liveNote}>
        <ul className={ROW}>
          {SurfaceVariant.map((variant) => (
            <li key={variant}>
              <Button
                variant={variant === level ? "primary" : "secondary"}
                aria-pressed={variant === level}
                onPress={() => setLevel(variant)}
              >
                {STRINGS.pick(variant)}
              </Button>
            </li>
          ))}
        </ul>
        <UiSurface
          variant={level}
          data-testid="live-surface"
          className={level === "transparent" ? `${BOX} border border-border` : BOX}
        >
          <Text>
            <bdi>{STRINGS.current(level)}</bdi>
          </Text>
        </UiSurface>
      </PageSection>
    </article>
  );
}
