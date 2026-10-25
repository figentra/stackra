/**
 * Stackra file contract:
 * Purpose: `LegalPage`, the page that shows one legal text: its title, the version and effective date line, and its
 *          paragraphs.
 * Boundary: renders text only: the body is split on blank lines into paragraphs and never parsed as HTML or Markdown.
 *           The texts and versions are data from the OS compliance service; this component names none. The version
 *           line is `consent::ui.legal.version`.
 * Runtime: browser
 * Governing contract: owner round 3 #29 (legal pages); release must-haves (legal pages).
 */
import type { I18nKey } from "@stackra/i18n";
import { useTranslation } from "@stackra/i18n/react";
import { Heading, Text } from "@stackra/ui/react";
import type { ReactElement } from "react";

import type { LegalPageProps } from "#ui/legal-page/legal-page-props.type";

/**
 * One legal text.
 *
 * @example
 * <LegalPage title={page.title} version={page.version} effectiveFrom={formatDate(page.effectiveFrom)} body={page.body} />
 */
export function LegalPage({ title, version, effectiveFrom, body }: LegalPageProps): ReactElement {
  const { t } = useTranslation();
  const paragraphs = body
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph !== "");
  return (
    <article>
      <Heading level={1}>{title}</Heading>
      <Text>{t("consent::ui.legal.version" as I18nKey, { version, effectiveFrom })}</Text>
      {paragraphs.map((paragraph, index) => (
        // oxlint-disable-next-line react/no-array-index-key -- reason: the paragraphs are static text in order
        <Text key={index}>{paragraph}</Text>
      ))}
    </article>
  );
}
