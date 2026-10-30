/**
 * Stackra file contract:
 * Purpose: the Docs home, the page of the top bar's Docs tab: the h1 and a short lead, three steps to get started
 *          (install, the provider, a component, each with its code), the foundations pages as cards from the registry,
 *          and the guides (browse, theme, choosing an overlay, right-to-left, llms.txt). The page titles the document.
 * Boundary: presentation only over the registry, the `showcase` catalogue and the `docs` catalogue; links keep the
 *           page's search params (scheme and locale).
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0060 (light, dark, RTL); STA-1371 (Docs home, owner approval
 *          2026-10-29).
 */
import type { I18nKey } from "@stackra/i18n";
import { byCategory, componentKeys, webPath } from "@stackra/showcase";
import { Card, Heading, Link, Text, useCatalogueText } from "@stackra/ui/react";
import { useLocation } from "react-router";

import { CodeSnippet } from "#src/components/code-snippet/code-snippet";
import { SHELL_KEYS } from "#src/components/playground-shell/shell-keys.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { DOCS_KEYS } from "#src/routes/docs/docs-keys.constant";

/** The page's keys. */
const K = DOCS_KEYS.docs;

/** The three steps: each one's words and the code it shows. */
const STEPS = [
  { title: K.start.install, body: K.start.install_body, code: "pnpm add @stackra/ui" },
  {
    title: K.start.provider,
    body: K.start.provider_body,
    code: `import { DesignSystemProvider } from "@stackra/ui/react";

<DesignSystemProvider colorScheme="system" locale="ar" direction="rtl">
  <App />
</DesignSystemProvider>`,
  },
  {
    title: K.start.use,
    body: K.start.use_body,
    code: `import { Button } from "@stackra/ui/react";

<Button onPress={save}>Save</Button>`,
  },
] as const;

/** The guides: where each one goes and its words. A path without a leading slash is a file, not a route. */
const GUIDES = [
  { href: "/components", title: K.guides.components, body: K.guides.components_body },
  { href: "/theme-studio", title: K.guides.studio, body: K.guides.studio_body },
  { href: "/alert-dialog#guidance", title: K.guides.overlays, body: K.guides.overlays_body },
  { href: "/bidi", title: K.guides.rtl, body: K.guides.rtl_body },
  // llms.txt is written by the build only (`llmsTxtPlugin`), so the dev server leaves this card out.
  ...(import.meta.env.PROD
    ? [{ href: "/llms.txt", title: K.guides.llms, body: K.guides.llms_body, isFile: true } as const]
    : []),
] as const;

/** A card that is one link: its title as a heading and a line under it. */
function LinkCard({
  href,
  title,
  body,
}: {
  readonly href: string;
  readonly title: string;
  readonly body: string;
}) {
  return (
    <Link
      href={href}
      underline="hover"
      className="group block h-full w-full hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
    >
      <Card className="lift grid h-full content-start gap-1 p-4">
        <Heading level={3} type="h5">
          {title}
        </Heading>
        <Text type="small" tone="muted">
          <bdi>{body}</bdi>
        </Text>
      </Card>
    </Link>
  );
}

/** The Docs home. */
export function Docs() {
  const t = useCatalogueText(MESSAGES.en);
  const { search } = useLocation();
  const foundations = byCategory("foundations").filter(
    (entry) => entry.status !== "planned" && entry.platforms.includes("react"),
  );
  // A route keeps the scheme and locale; the hash, if any, stays last.
  const withSearch = (href: string) => {
    const [path, hash] = href.split("#");
    return `${path}${search}${hash === undefined ? "" : `#${hash}`}`;
  };

  return (
    <article className="grid grid-cols-[minmax(0,1fr)] gap-14 pb-8">
      <title>{`${t(K.title)} · ${t(SHELL_KEYS.shell.title)}`}</title>
      <header className="grid max-w-3xl gap-3">
        <Text type="small" tone="muted" className="font-medium">
          {t(K.eyebrow)}
        </Text>
        <Heading level={1}>{t(K.title)}</Heading>
        <Text className="text-xl font-medium text-foreground">
          <bdi>{t(K.headline)}</bdi>
        </Text>
        <Text tone="muted" className="max-w-prose">
          <bdi>{t(K.intro)}</bdi>
        </Text>
      </header>

      <section aria-labelledby="docs-start" className="grid gap-4">
        <Heading id="docs-start" level={2}>
          {t(K.start.title)}
        </Heading>
        <ol className="grid gap-4 lg:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="grid min-w-0">
              <Card className="grid min-w-0 content-start gap-3 p-4">
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="grid size-7 shrink-0 place-items-center bg-accent text-sm font-semibold text-accent-foreground"
                    style={{ borderRadius: "var(--radius-lg)" }}
                  >
                    {index + 1}
                  </span>
                  <Heading level={3} type="h5">
                    {t(step.title)}
                  </Heading>
                </div>
                <Text type="small" tone="muted">
                  <bdi>{t(step.body)}</bdi>
                </Text>
                {/* Code reads left to right in every locale. */}
                <div dir="ltr" className="min-w-0">
                  <CodeSnippet code={step.code} />
                </div>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="docs-foundations" className="grid gap-4">
        <div className="grid gap-1">
          <Heading id="docs-foundations" level={2}>
            {t(K.sections.foundations)}
          </Heading>
          <Text tone="muted">
            <bdi>{t(K.sections.foundations_body)}</bdi>
          </Text>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {foundations.map((entry) => {
            const keys = componentKeys(entry);
            return (
              <li key={entry.slug} className="grid">
                <LinkCard
                  href={`${webPath(entry)}${search}`}
                  title={t(keys.title as I18nKey)}
                  body={t(keys.description as I18nKey)}
                />
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="docs-guides" className="grid gap-4">
        <div className="grid gap-1">
          <Heading id="docs-guides" level={2}>
            {t(K.sections.guides)}
          </Heading>
          <Text tone="muted">
            <bdi>{t(K.sections.guides_body)}</bdi>
          </Text>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GUIDES.map((guide) => (
            <li key={guide.href} className="grid">
              <LinkCard
                href={"isFile" in guide ? guide.href : withSearch(guide.href)}
                title={t(guide.title)}
                body={t(guide.body)}
              />
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
