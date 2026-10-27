/**
 * Stackra file contract:
 * Purpose: the page of the separator route: a horizontal rule between paragraphs, each colour level on the surface it
 *          matches, vertical rules between links, a labelled rule between two groups of controls, and a live sample
 *          that turns a rule from horizontal to vertical, all from `@stackra/ui/react` with real props.
 * Boundary: presentation only; strings in one `STRINGS` constant until @stackra/i18n. The rules are 1 px: the
 *          theme's separator colours are decoration, so their strength is not an axe rule.
 * Runtime: browser
 * Governing contract: ADR 0302 (decisions 3 and 5); ADR 0303 (decision 7); ADR 0304; ADR 0060 (light, dark, RTL).
 */
import { SurfaceVariant, type SeparatorVariant } from "@stackra/ui/contracts";
import { Button, Heading, Link, Separator as UiSeparator, Surface, Text } from "@stackra/ui/react";
import { useState } from "react";

import { PageSection } from "#src/components/page-section";
import { SeparatorRoute } from "#src/routes/separator/separator.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::separator.*` keys.
const STRINGS = {
  documentTitle: `${SeparatorRoute.title} · Stackra Playground`,
  intro:
    "A Separator is a rule between two groups. It is horizontal by default; a vertical one stretches to its row's height. Its colour level matches the surface it sits on: pass the level, it does not read it from the surface around it.",
  horizontal: "Horizontal",
  horizontalNote: "Between two paragraphs, the full width of the container.",
  before: "The first paragraph ends here.",
  after: "The second paragraph starts here.",
  levels: "Levels",
  levelsNote:
    "Each level on the surface it matches. The transparent surface pairs with the default level.",
  level: (level: string) => `Level ${level}`,
  vertical: "Vertical",
  verticalNote: "Between links in a row; the rule follows the row's height in both directions.",
  links: "Related pages",
  labelled: "Labelled",
  labelledNote: "A rule that carries a name, between two groups of controls.",
  groupName: "Text formatting",
  ruleName: "Between character and paragraph styles",
  bold: "Bold",
  italic: "Italic",
  left: "Align start",
  right: "Align end",
  live: "Try it",
  liveNote: "Turn the rule between the two blocks.",
  turn: "Turn the rule",
  orientation: (value: string) => `The rule is ${value}.`,
  blockA: "Block A",
  blockB: "Block B",
} as const;

/** The pages the vertical row links to: the playground's own, so every link works. */
const RELATED = [
  { href: "/foundations", text: "Foundations" },
  { href: "/typography", text: "Typography" },
  { href: "/card", text: "Card" },
] as const;

/** The padding and radius every surface sample adds, since the web surface has neither. */
const BOX = "rounded-3xl p-6";

/** The rule that pairs with each surface level; the transparent surface sits on the page, so it pairs with `default`. */
const RULE_FOR: Readonly<Record<SurfaceVariant, SeparatorVariant>> = {
  default: "default",
  secondary: "secondary",
  tertiary: "tertiary",
  transparent: "default",
};

/** The Separator page. */
export function Separator() {
  const [isVertical, setIsVertical] = useState(false);

  return (
    <article className="grid gap-10">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <Heading level={1}>{SeparatorRoute.title}</Heading>
        <Text className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </Text>
      </header>

      <PageSection
        id="separator-horizontal"
        title={STRINGS.horizontal}
        note={STRINGS.horizontalNote}
      >
        <div className="grid max-w-prose gap-3">
          <Text>
            <bdi>{STRINGS.before}</bdi>
          </Text>
          <UiSeparator />
          <Text>
            <bdi>{STRINGS.after}</bdi>
          </Text>
        </div>
      </PageSection>

      <PageSection id="separator-levels" title={STRINGS.levels} note={STRINGS.levelsNote}>
        <div className="grid gap-4 sm:grid-cols-2">
          {SurfaceVariant.map((variant) => (
            <Surface
              key={variant}
              variant={variant}
              className={variant === "transparent" ? `${BOX} border border-border` : BOX}
            >
              <Text>{STRINGS.level(variant)}</Text>
              <UiSeparator variant={RULE_FOR[variant]} className="my-3" />
              <Text tone="muted">{STRINGS.level(RULE_FOR[variant])}</Text>
            </Surface>
          ))}
        </div>
      </PageSection>

      <PageSection id="separator-vertical" title={STRINGS.vertical} note={STRINGS.verticalNote}>
        <nav aria-label={STRINGS.links}>
          <ul className="flex h-5 items-center gap-4">
            {RELATED.map((link, index) => (
              <li key={link.href} className="flex h-full items-center gap-4">
                {index > 0 ? <UiSeparator orientation="vertical" /> : null}
                <Link href={link.href} underline="hover">
                  {link.text}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </PageSection>

      <PageSection id="separator-labelled" title={STRINGS.labelled} note={STRINGS.labelledNote}>
        <div role="group" aria-label={STRINGS.groupName} className="flex h-9 items-center gap-2">
          <Button size="sm" variant="secondary">
            {STRINGS.bold}
          </Button>
          <Button size="sm" variant="secondary">
            {STRINGS.italic}
          </Button>
          <UiSeparator orientation="vertical" aria-label={STRINGS.ruleName} className="mx-2" />
          <Button size="sm" variant="secondary">
            {STRINGS.left}
          </Button>
          <Button size="sm" variant="secondary">
            {STRINGS.right}
          </Button>
        </div>
      </PageSection>

      <PageSection id="separator-live" title={STRINGS.live} note={STRINGS.liveNote}>
        <div className="flex flex-wrap items-center gap-4">
          <Button variant="secondary" onPress={() => setIsVertical((value) => !value)}>
            {STRINGS.turn}
          </Button>
          <Text tone="muted" data-testid="orientation">
            <bdi>{STRINGS.orientation(isVertical ? "vertical" : "horizontal")}</bdi>
          </Text>
        </div>
        <div className={isVertical ? "flex items-stretch gap-4" : "grid max-w-xs gap-4"}>
          <Text>{STRINGS.blockA}</Text>
          <UiSeparator
            orientation={isVertical ? "vertical" : "horizontal"}
            data-testid="live-rule"
          />
          <Text>{STRINGS.blockB}</Text>
        </div>
      </PageSection>
    </article>
  );
}
