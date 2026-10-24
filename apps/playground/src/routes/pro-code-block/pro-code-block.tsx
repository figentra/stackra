/**
 * Stackra file contract:
 * Purpose: the page of the CodeBlock route: `@stackra/ui-pro`'s CodeBlock with a language label and a named copy button,
 *          for TypeScript and for JSON, the code highlighted by Shiki in the theme of the page.
 * Boundary: presentation only; the code is local. Code is always left to right (`dir="ltr"`) so a right-to-left page keeps
 *          it readable. The copy button names itself; the language label is text in the header.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0060 (light, dark, RTL); STA-416 FR-012.
 */
import * as UiPro from "@stackra/ui-pro/react";

import { ProCodeBlockRoute } from "#src/routes/pro-code-block/pro-code-block.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::pro-code-block.*` keys.
const STRINGS = {
  documentTitle: `${ProCodeBlockRoute.title} · Stackra Playground`,
  intro:
    "A block of code with its language named in the header, highlighted for the current theme, and a button that copies it.",
  typescript: "TypeScript",
  json: "JSON",
  copy: "Copy the code",
} as const;

const TYPESCRIPT = `function greet(name: string) {
  return \`Hello, \${name}!\`;
}

console.log(greet("Stackra"));`;

const JSON_CODE = `{
  "name": "@stackra/ui-pro",
  "private": true,
  "type": "module"
}`;

/** The CodeBlock page. */
export function ProCodeBlock() {
  return (
    <article className="grid gap-6">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <h1 className="type-h1">{ProCodeBlockRoute.title}</h1>
        <p className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </p>
      </header>
      {[
        { id: "typescript", title: STRINGS.typescript, language: "typescript", code: TYPESCRIPT },
        { id: "json", title: STRINGS.json, language: "json", code: JSON_CODE },
      ].map((block) => (
        <section
          key={block.id}
          aria-labelledby={`${block.id}-heading`}
          className="grid max-w-xl gap-3"
        >
          <h2 id={`${block.id}-heading`} className="type-h2">
            {block.title}
          </h2>
          <div dir="ltr">
            <UiPro.CodeBlock>
              <UiPro.CodeBlock.Header>
                <span className="text-xs uppercase text-muted">{block.language}</span>
                <UiPro.CodeBlock.CopyButton code={block.code} label={STRINGS.copy} />
              </UiPro.CodeBlock.Header>
              <UiPro.CodeBlock.Code code={block.code} language={block.language} />
            </UiPro.CodeBlock>
          </div>
        </section>
      ))}
    </article>
  );
}
