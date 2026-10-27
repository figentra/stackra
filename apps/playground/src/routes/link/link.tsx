/**
 * Stackra file contract:
 * Purpose: the page of the link route: every Link tone with hover and always underlines, links inside running text,
 *          external links with and without a label, an internal link that navigates through the shell's router, the
 *          disabled, press-only and icon-only states, and an Arabic sentence whose link wraps, all from
 *          `@stackra/ui/react` with real props.
 * Boundary: presentation only; strings in one `STRINGS` constant until @stackra/i18n, text in another language
 *          carries its own `lang`. A hover-only link never sits inside a paragraph: the theme's link colour equals the
 *          text colour, so only the underline tells it apart there (WCAG 1.4.1). Icons are drawn by name
 *          through `Icon` (ADR 0303 decision 10).
 * Runtime: browser
 * Governing contract: ADR 0302 (decisions 3 and 5); ADR 0303 (decisions 5 and 7); ADR 0060 (right-to-left).
 */
import { Enum, Tone } from "@stackra/contracts";
import { Heading, Icon, Link as UiLink, Text } from "@stackra/ui/react";
import { useState, type ReactNode } from "react";
import { useLocation } from "react-router";

import { PageSection } from "#src/components/page-section";
import { LinkRoute } from "#src/routes/link/link.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::link.*` keys.
const STRINGS = {
  documentTitle: `${LinkRoute.title} · Stackra Playground`,
  intro:
    "Link is a text link with one props API on web and native. It takes a tone, an underline, an external form and a disabled state, and it never imports a router: an app path reaches the app's router through the nearest RouterProvider.",
  tones: "Tones",
  tonesNote:
    "Standalone links, one per tone: first with the underline on hover, then always underlined.",
  hover: "Underline on hover",
  always: "Underline always",
  running: "In running text",
  runningNote:
    "A link in a paragraph is always underlined: the theme's link colour equals the text colour, so colour alone would not tell it apart.",
  beforeLinks: "Links come in every tone: ",
  afterLinks: ", and each stays underlined in the sentence.",
  external: "External",
  externalNote:
    "An external link opens a new tab, shows the external mark at the inline end and says so to screen readers.",
  externalText: "HeroUI documentation",
  externalLabelled: "Icon only, labelled",
  externalLabel: "HeroUI website",
  router: "Router",
  routerNote:
    "An app path is a client navigation through the shell's RouterProvider: the page does not reload and the scheme and language stay.",
  routerLink: "Go to Foundations",
  states: "States",
  statesNote: "Disabled, press only (no href) and icon only, each with its own name.",
  disabledLink: "Disabled link",
  pressLink: "Press only",
  pressCount: (count: number) => `Pressed ${count} ${count === 1 ? "time" : "times"}.`,
  settingsLabel: "Settings",
  long: "Long text",
  longNote: "An Arabic sentence with a link that wraps across lines.",
  arabic:
    "هذه جملة عربية طويلة تحتوي على رابط يلتف عبر عدة أسطر عندما يضيق المكان، ليظهر كيف يتصرف الخط السفلي والاتجاه داخل النص.",
  arabicLinkText: "رابط يلتف عبر عدة أسطر داخل الجملة",
  arabicSentenceEnd: "، ثم تتابع الجملة بعده.",
} as const;

/** The list that lays samples out in a wrapping row. */
const ROW = "flex flex-wrap items-center gap-x-6 gap-y-2";

/** A titled list of one Link per tone. */
function ToneList({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="grid gap-2">
      <Heading level={3}>{title}</Heading>
      <ul className={ROW}>{children}</ul>
    </div>
  );
}

/** The Link page. */
export function Link() {
  const { pathname, search } = useLocation();
  const [presses, setPresses] = useState(0);
  // A same-page anchor that keeps the scheme and language, which a bare `#id` would drop.
  const here = `${pathname}${search}`;

  return (
    <article className="grid gap-10">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <Heading level={1}>{LinkRoute.title}</Heading>
        <Text className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </Text>
      </header>

      <PageSection id="link-tones" title={STRINGS.tones} note={STRINGS.tonesNote}>
        <ToneList title={STRINGS.hover}>
          {Enum.values(Tone).map((tone) => (
            <li key={tone}>
              <UiLink href={`${here}#link-tones`} tone={tone} underline="hover">
                {tone}
              </UiLink>
            </li>
          ))}
        </ToneList>
        <ToneList title={STRINGS.always}>
          {Enum.values(Tone).map((tone) => (
            <li key={tone}>
              <UiLink href={`${here}#link-tones`} tone={tone} underline="always">
                {tone}
              </UiLink>
            </li>
          ))}
        </ToneList>
      </PageSection>

      <PageSection id="link-running" title={STRINGS.running} note={STRINGS.runningNote}>
        {/* Only `always` links in a paragraph: a hover-only one would fail WCAG 1.4.1 and axe's link-in-text-block. */}
        <Text className="max-w-prose">
          <bdi>{STRINGS.beforeLinks}</bdi>
          {Enum.values(Tone).map((tone, index) => (
            <span key={tone}>
              <UiLink href={`${here}#link-running`} tone={tone}>
                {tone}
              </UiLink>
              {index < Enum.values(Tone).length - 1 ? ", " : ""}
            </span>
          ))}
          <bdi>{STRINGS.afterLinks}</bdi>
        </Text>
      </PageSection>

      <PageSection id="link-external" title={STRINGS.external} note={STRINGS.externalNote}>
        <ul className={ROW}>
          <li>
            <UiLink href="https://heroui.com" isExternal>
              {STRINGS.externalText}
            </UiLink>
          </li>
          <li>
            <UiLink href="https://heroui.com" isExternal label={STRINGS.externalLabel}>
              <Icon name="settings" />
            </UiLink>
          </li>
        </ul>
      </PageSection>

      <PageSection id="link-router" title={STRINGS.router} note={STRINGS.routerNote}>
        <div>
          <UiLink href={`/foundations${search}`} underline="hover">
            {STRINGS.routerLink}
          </UiLink>
        </div>
      </PageSection>

      <PageSection id="link-states" title={STRINGS.states} note={STRINGS.statesNote}>
        <ul className={ROW}>
          <li>
            <UiLink href={`${here}#link-states`} isDisabled>
              {STRINGS.disabledLink}
            </UiLink>
          </li>
          <li>
            <UiLink onPress={() => setPresses((count) => count + 1)}>{STRINGS.pressLink}</UiLink>
          </li>
          <li>
            <UiLink href={`${here}#link-states`} label={STRINGS.settingsLabel}>
              <Icon name="settings" />
            </UiLink>
          </li>
          <li>
            <output aria-live="polite" data-testid="press-count">
              <bdi>{STRINGS.pressCount(presses)}</bdi>
            </output>
          </li>
        </ul>
      </PageSection>

      <PageSection id="link-long" title={STRINGS.long} note={STRINGS.longNote}>
        <Text lang="ar" className="max-w-xs">
          {STRINGS.arabic} <UiLink href={`${here}#link-long`}>{STRINGS.arabicLinkText}</UiLink>
          {STRINGS.arabicSentenceEnd}
        </Text>
      </PageSection>
    </article>
  );
}
