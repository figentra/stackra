/**
 * Stackra file contract:
 * Purpose: `ComponentPage`, the one web component page: for a registry entry it draws the sections of the spec in
 *          order (the informative hero with its live signature demo and the what/when/how pillars, links, import with
 *          the platform switch, usage, anatomy for a compound, guidance, the examples, the knobs playground, styling
 *          with the token table, accessibility with the keyboard map, right-to-left, the API reference per part, the
 *          Stackra section, related entries and the pager; STA-1371), every section an anchor with the id the shell's TOC rail and section tabs
 *          link to (`tocItems`). Every `routes/<slug>/<slug>.tsx` renders this with its tier and slug.
 * Boundary: composition only; the words are `showcase::` keys, the demos come from `demos/`, the API from the
 *           generated ApiDoc. The TOC rail, the section tabs and the sidebar are the shell's (WP4).
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) sections 3.2 and 4; ADR 0302 (decision 5).
 */
import type { I18nKey } from "@stackra/i18n";
import {
  bySlug,
  categoryKeys,
  COMPONENT_DOCS,
  componentKeys,
  docKeys,
  entryKey,
  importLine,
  type Platform,
} from "@stackra/showcase";
import { Chip, Heading, Text, useCatalogueText } from "@stackra/ui/react";
import { lazy, type ReactNode, Suspense, useDeferredValue, useEffect, useState } from "react";

import { AnatomyBlock } from "#src/components/component-page/anatomy-block";
import { anatomyCode } from "#src/components/component-page/anatomy-code.function";
import { ApiTable } from "#src/components/component-page/api-table";
import { COMPONENT_PAGE_KEYS } from "#src/components/component-page/component-page-keys.constant";
import type { ComponentPageProps } from "#src/components/component-page/component-page.props";
import { DocsLinks } from "#src/components/component-page/docs-links";
import { ExamplePreview } from "#src/components/component-page/example-preview";
import { ImportBlock } from "#src/components/component-page/import-block";
import { Pager } from "#src/components/component-page/pager";
import { PropsTable } from "#src/components/component-page/props-table";
import { RelatedCards } from "#src/components/component-page/related-cards";
import { StackraSection } from "#src/components/component-page/stackra-section";
import { toMarkdown } from "#src/components/component-page/to-markdown.function";
import { useApiDoc } from "#src/components/component-page/use-api-doc";
import { LiveDemo } from "#src/components/component-page/live-demo";
import { preloadApiDoc } from "#src/components/component-page/preload-api-doc.function";
import { preloadDemo } from "#src/components/component-page/preload-demo.function";
import { ViewOptions } from "#src/components/component-page/view-options";
import { DocHero } from "#src/components/doc-page/doc-hero";
import { DOC_PAGE_KEYS } from "#src/components/doc-page/doc-page-keys.constant";
import { GuidanceSection } from "#src/components/doc-page/guidance-section";
import { KeyboardPanel } from "#src/components/doc-page/keyboard-panel";
import { PillarBand } from "#src/components/doc-page/pillar-band";
import { RtlPanel } from "#src/components/doc-page/rtl-panel";
import { TokenTable } from "#src/components/doc-page/token-table";
import { SHELL_KEYS } from "#src/components/playground-shell/shell-keys.constant";
import { StatusChip } from "#src/components/status-chip";
import { SHOWCASE_KEYS } from "#src/constants/showcase-keys.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { DEMOS, demoPath } from "#src/demos";

const K = COMPONENT_PAGE_KEYS.showcase;
const D = DOC_PAGE_KEYS.showcase.doc.ui;

/** The knobs playground loads the whole `@stackra/ui/react` entry, so it is its own chunk. */
const KnobsPlayground = lazy(() => import("#src/components/doc-page/knobs-playground"));

/** The anchor id of an example. */
const exampleAnchor = (id: string) => `example-${id}`;

/** A level-2 section with its heading. */
function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="grid gap-4 scroll-mt-24">
      <Heading id={`${id}-title`} level={2}>
        {title}
      </Heading>
      {children}
    </section>
  );
}

/** The component page of `tier/slug`. */
export function ComponentPage({ tier, slug, lead }: ComponentPageProps) {
  const entry = bySlug(tier, slug);
  if (!entry) throw new Error(`no registry entry for ${tier}/${slug}`);
  const t = useCatalogueText(MESSAGES.en);
  // The switch shows the picked platform at once; the page body follows as a deferred value, so React keeps the
  // current body on screen until the other platform's demos and API are ready, instead of blocking the click.
  const [picked, setPicked] = useState<Platform>(
    entry.platforms.includes("react") ? "react" : (entry.platforms[0] ?? "react"),
  );
  const platform = useDeferredValue(picked);
  // Every demo of the page, on every platform, and each platform's API, fetched as the page opens: a switch then
  // has nothing left to load.
  useEffect(() => {
    for (const example of entry.examples) preloadDemo(demoPath(entry, example.id));
    for (const value of entry.platforms) preloadApiDoc(value, entryKey(entry));
  }, [entry]);
  const apiDoc = useApiDoc(platform, entryKey(entry));
  const keys = componentKeys(entry);
  const title = t(keys.title as I18nKey);
  const exampleTitle = (id: string) => t(keys.examples[id]?.title as I18nKey);
  const exampleNote = (id: string) => {
    // A note is optional in the catalogue: the English fallback throws on a key no locale has.
    try {
      return t(keys.examples[id]?.note as I18nKey);
    } catch {
      return undefined;
    }
  };
  const doc = docKeys(entry);
  const words = (key: string) => t(key as I18nKey);
  const playground = COMPONENT_DOCS[entryKey(entry)]?.playground;
  const rootPart = apiDoc?.parts[0];
  const isCompound = entry.parts.length > 1;
  const shown = entry.examples.filter((example) =>
    (example.platforms ?? entry.platforms).includes(platform),
  );
  const [usage, ...examples] = shown;
  // The hero shows the entry's card example, its signature, or the usage.
  const signature = shown.find((example) => example.card) ?? usage;

  const markdown = async () => {
    const sources = await Promise.all(
      shown.map((example) => DEMOS.sources[demoPath(entry, example.id)]?.()),
    );
    return toMarkdown({
      title,
      description: `${words(doc.fields.headline)} ${words(doc.fields.intro)}`,
      importLine: importLine(entry, platform),
      anatomy: isCompound ? anatomyCode(entry) : undefined,
      examples: shown.map((example, index) => ({
        title: exampleTitle(example.id),
        code: sources[index],
      })),
      parts: apiDoc?.parts ?? [],
      slots: apiDoc?.slots,
      words: {
        import: t(K.section.import),
        usage: t(K.section.usage),
        anatomy: t(K.section.anatomy),
        styling: t(K.section.styling),
        api: t(K.section.api),
        propsOf: (part) => t(K.api.props_of, { part }),
        renderProps: t(K.api.render_props),
        prop: t(K.api.prop),
        type: t(K.api.type),
        default: t(K.api.default),
        description: t(K.api.description),
      },
    });
  };

  return (
    <article className="grid gap-10">
      <title>{`${title} · ${t(SHELL_KEYS.shell.title)}`}</title>
      <div className="grid min-w-0 gap-12">
        <DocHero
          eyebrow={t(categoryKeys(entry.category).title as I18nKey)}
          title={title}
          page={title}
          chips={
            <>
              <StatusChip status={entry.status} showStable />
              {entry.advanced ? (
                <Chip size="sm" variant="soft">
                  {t(SHOWCASE_KEYS.showcase.ui.advanced)}
                </Chip>
              ) : null}
              {entry.platforms.length === 1 && entry.platforms[0] ? (
                <Chip size="sm" variant="soft">
                  {t(K.platform_only[entry.platforms[0]])}
                </Chip>
              ) : (
                entry.platforms.map((value) => (
                  <Chip key={value} size="sm" variant="soft">
                    {t(K.platform[value])}
                  </Chip>
                ))
              )}
            </>
          }
          headline={words(doc.fields.headline)}
          intro={words(doc.fields.intro)}
          tags={words(doc.fields.tags)}
          actions={<ViewOptions entry={entry} platform={platform} markdown={markdown} />}
          demo={signature ? <LiveDemo path={demoPath(entry, signature.id)} /> : undefined}
          footer={
            <div id="links">
              <DocsLinks entry={entry} platform={platform} />
            </div>
          }
        />
        <PillarBand
          what={<bdi>{words(doc.fields.what)}</bdi>}
          when={<bdi>{words(doc.fields.when)}</bdi>}
          how={
            <>
              <bdi>{t(platform === "native" ? D.how_native : D.how_web)}</bdi>{" "}
              <bdi>{words(doc.fields.rtl)}</bdi>{" "}
              <bdi>{t(D.tokens_count, { count: entry.tokens.length })}</bdi>
            </>
          }
        />
        {lead}

        <Section id="import" title={t(K.section.import)}>
          <ImportBlock entry={entry} platform={picked} onPlatformChange={setPicked} />
          {usage ? (
            <ExamplePreview
              id="usage"
              entry={entry}
              example={usage}
              title={t(K.section.usage)}
              note={exampleNote(usage.id)}
            />
          ) : null}
          {isCompound ? (
            <section
              id="anatomy"
              aria-labelledby="anatomy-title"
              className="grid gap-3 scroll-mt-24"
            >
              <Heading id="anatomy-title" level={3}>
                {t(K.section.anatomy)}
              </Heading>
              <AnatomyBlock entry={entry} />
            </section>
          ) : null}
        </Section>

        {doc.whenNot ? (
          <Section id="guidance" title={t(K.section.guidance)}>
            <GuidanceSection entry={entry} />
          </Section>
        ) : null}

        {examples.length ? (
          <Section id="examples" title={t(K.section.examples)}>
            {examples.map((example) => (
              <ExamplePreview
                key={example.id}
                id={exampleAnchor(example.id)}
                entry={entry}
                example={example}
                title={exampleTitle(example.id)}
                note={exampleNote(example.id)}
              />
            ))}
          </Section>
        ) : null}

        {playground && rootPart && platform === "react" ? (
          <Section id="playground" title={t(K.section.playground)}>
            <Text tone="muted" className="max-w-prose">
              {t(D.playground_note)}
            </Text>
            <Suspense fallback={<div className="min-h-96" />}>
              <KnobsPlayground
                entry={entry}
                part={rootPart}
                title={title}
                hasChildren={playground.children === true}
              />
            </Suspense>
          </Section>
        ) : null}

        {apiDoc?.slots?.length || entry.tokens.length ? (
          <Section id="styling" title={t(K.section.styling)}>
            {apiDoc?.slots?.length ? (
              <ul className="grid gap-1">
                {apiDoc.slots.map((slot) => (
                  <li key={slot.name} className="flex flex-wrap items-baseline gap-2">
                    <code dir="ltr" className="font-mono text-xs">
                      {slot.name}
                    </code>
                    <Text type="small" tone="muted">
                      <bdi>{slot.description}</bdi>
                    </Text>
                  </li>
                ))}
              </ul>
            ) : null}
            <TokenTable entry={entry} />
          </Section>
        ) : null}

        {entry.a11y?.length || doc.keyboard.length ? (
          <Section id="accessibility" title={t(K.section.accessibility)}>
            {entry.a11y?.length ? (
              <ul className="grid list-disc gap-1 ps-5">
                {entry.a11y.map((key) => (
                  <li key={key}>
                    <bdi>{t(`showcase::a11y.${key}` as I18nKey)}</bdi>
                  </li>
                ))}
              </ul>
            ) : null}
            <KeyboardPanel entry={entry} />
          </Section>
        ) : null}

        <Section id="rtl" title={t(K.section.rtl)}>
          <RtlPanel entry={entry} exampleId={platform === "react" ? usage?.id : undefined} />
        </Section>

        {apiDoc ? (
          <Section id="api" title={t(K.section.api)}>
            {apiDoc.parts.map((part) => (
              <ApiTable key={part.name} part={part} />
            ))}
            {apiDoc.hooks?.length ? (
              <section id="hooks" aria-labelledby="hooks-title" className="grid gap-3 scroll-mt-24">
                <Heading id="hooks-title" level={3}>
                  {t(K.api.hooks)}
                </Heading>
                {apiDoc.hooks.map((hook) => (
                  <div key={hook.name} className="grid gap-2">
                    <Heading level={4}>
                      <code dir="ltr" className="font-mono">
                        {hook.signature}
                      </code>
                    </Heading>
                    <PropsTable
                      label={`${hook.name} ${t(K.api.return_value)}`}
                      rows={hook.returns}
                      hasDefault={false}
                    />
                  </div>
                ))}
              </section>
            ) : null}
          </Section>
        ) : null}

        <Section id="stackra" title={t(K.section.stackra)}>
          <StackraSection entry={entry} platform={platform} apiDoc={apiDoc} />
        </Section>

        {entry.related.length ? (
          <Section id="related" title={t(K.section.related)}>
            <RelatedCards entry={entry} />
          </Section>
        ) : null}

        <div id="pager">
          <Pager entry={entry} platform={platform} />
        </div>
      </div>
    </article>
  );
}
