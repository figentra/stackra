/**
 * Stackra file contract:
 * Purpose: `ExamplePreview`, HeroUI's preview container with Preview, Code and Install tabs: the Preview tab is a pane of
 *          the catalogue's minimum height with the demo centred and its own direction and scheme toggles at the top end,
 *          the Code tab the same file's source, the Install tab the package line and the import (STA-1371). The direction toggle flips the pane's `dir`, `lang`, locale and catalogue (Arabic for RTL); the scheme toggle sets the
 *          theme's `.light`/`.dark` on the pane, so the sample recolours in place.
 * Boundary: one example; the page lists them. The pane is a `Card`, so its shape is the theme's.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (ExamplePreview); ADR 0060 (RTL).
 */
import { importLine } from "@stackra/showcase";
import {
  Card,
  Heading,
  Icon,
  Tabs,
  Text,
  ToggleButton,
  ToggleButtonGroup,
  useCatalogueText,
} from "@stackra/ui/react";
import { useState } from "react";

import { CodePane } from "#src/components/component-page/code-pane";
import { COMPONENT_PAGE_KEYS } from "#src/components/component-page/component-page-keys.constant";
import type { ExamplePreviewProps } from "#src/components/component-page/example-preview.props";
import { LiveDemo } from "#src/components/component-page/live-demo";
import { CodeSnippet } from "#src/components/code-snippet/code-snippet";
import { DOC_PAGE_KEYS } from "#src/components/doc-page/doc-page-keys.constant";
import { SHELL_KEYS } from "#src/components/playground-shell/shell-keys.constant";
import { ShowcaseI18n } from "#src/components/showcase-i18n";
import { MESSAGES } from "#src/constants/messages.constant";
import { DEMOS, demoPath } from "#src/demos";

const K = COMPONENT_PAGE_KEYS.showcase.ui;
const D = DOC_PAGE_KEYS.showcase.doc.ui;

/** The pane height HeroUI's docs use, in pixels. */
const DEFAULT_MIN_HEIGHT = 350;

const PANE_SCHEMES = ["light", "dark"] as const;
const SCHEME_ICONS = { light: "sun", dark: "moon" } as const;
const DIRECTIONS = ["ltr", "rtl"] as const;

/** One example: title, note, live pane with toggles, code. */
export function ExamplePreview({
  id,
  entry,
  example,
  title,
  note,
  level = 3,
}: ExamplePreviewProps) {
  const t = useCatalogueText(MESSAGES.en);
  const [dir, setDir] = useState<(typeof DIRECTIONS)[number]>();
  const [scheme, setScheme] = useState<(typeof PANE_SCHEMES)[number]>();
  const path = demoPath(entry, example.id);
  const headingId = `${id}-title`;
  return (
    <section id={id} aria-labelledby={headingId} className="grid gap-3 scroll-mt-24">
      <Heading id={headingId} level={level}>
        {title}
      </Heading>
      {note ? (
        <Text tone="muted" className="max-w-prose">
          <bdi>{note}</bdi>
        </Text>
      ) : null}
      {/* inline-size containment: the demo takes the column's width and never widens the page. */}
      <Card className="min-w-0 overflow-hidden p-0 [contain:inline-size]">
        <Tabs
          label={title}
          variant="secondary"
          className="p-2"
          items={[
            {
              id: "preview",
              label: t(D.tab_preview),
              content: (
                <div
                  dir={dir}
                  lang={dir === "rtl" ? "ar" : dir === "ltr" ? "en" : undefined}
                  data-theme={scheme}
                  className={`@container relative grid min-w-0 place-items-center overflow-x-auto bg-background p-6 pt-12 text-foreground ${scheme ?? ""}`}
                  style={{
                    minHeight: example.minHeight ?? DEFAULT_MIN_HEIGHT,
                    colorScheme: scheme,
                  }}
                >
                  <span aria-hidden="true" className="stage-dots" />
                  <div className="absolute end-2 top-2 flex gap-1">
                    <ToggleButtonGroup
                      aria-label={t(K.direction)}
                      size="sm"
                      selectionMode="single"
                      selectedKeys={dir ? [dir] : []}
                      onSelectionChange={(keys) =>
                        setDir(DIRECTIONS.find((value) => keys.has(value)))
                      }
                    >
                      {DIRECTIONS.map((value) => (
                        <ToggleButton key={value} id={value} aria-label={value.toUpperCase()}>
                          <span dir="ltr" className="font-mono text-xs uppercase">
                            {value}
                          </span>
                        </ToggleButton>
                      ))}
                    </ToggleButtonGroup>
                    <ToggleButtonGroup
                      aria-label={t(K.scheme)}
                      size="sm"
                      selectionMode="single"
                      selectedKeys={scheme ? [scheme] : []}
                      onSelectionChange={(keys) =>
                        setScheme(PANE_SCHEMES.find((value) => keys.has(value)))
                      }
                    >
                      {PANE_SCHEMES.map((value) => (
                        <ToggleButton
                          key={value}
                          id={value}
                          aria-label={t(SHELL_KEYS.shell.scheme[value])}
                        >
                          <Icon name={SCHEME_ICONS[value]} size="sm" />
                        </ToggleButton>
                      ))}
                    </ToggleButtonGroup>
                  </div>
                  {/* The toggle flips the words and React Aria's locale too, not only the box's `dir`: components
                      that read the locale (icon mirroring, number formats) followed the page before. */}
                  {dir ? (
                    <ShowcaseI18n locale={dir === "rtl" ? "ar" : "en"}>
                      <LiveDemo path={path} />
                    </ShowcaseI18n>
                  ) : (
                    <LiveDemo path={path} />
                  )}
                </div>
              ),
            },
            {
              id: "code",
              label: t(D.tab_code),
              content: (
                <CodePane fileName={`${example.id}.tsx`} load={DEMOS.sources[path]} isOpen />
              ),
            },
            {
              id: "install",
              label: t(D.tab_install),
              content: (
                <div className="grid gap-3 p-2">
                  <Text type="small" tone="muted">
                    {t(D.install_hint)}
                  </Text>
                  <CodeSnippet
                    code={`pnpm add ${entry.packageName}`}
                    title="terminal"
                    copyLabel={t(K.copy)}
                  />
                  <CodeSnippet
                    code={importLine(entry, "react")}
                    title={`${example.id}.tsx`}
                    copyLabel={t(K.copy)}
                  />
                </div>
              ),
            },
          ]}
        />
      </Card>
    </section>
  );
}
