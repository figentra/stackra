/**
 * Stackra file contract:
 * Purpose: `TermsPrompt`, the versioned terms acceptance a person sees at sign-up and whenever a required document
 *          changes: the documents with links to read them, and one accept button.
 * Boundary: renders nothing when no document is listed. It records nothing: `onAccept` calls the server, which appends
 *           the proofs. Texts are `consent::ui.terms.*`.
 * Runtime: browser
 * Governing contract: owner round 3 #29 (versioned terms acceptance at sign-up and on change); release must-haves.
 */
import type { I18nKey } from "@stackra/i18n";
import { useTranslation } from "@stackra/i18n/react";
import { Button, Card, Heading, Link, Text } from "@stackra/ui/react";
import type { ReactElement } from "react";

import type { TermsPromptProps } from "#ui/terms-prompt/terms-prompt-props.type";

/**
 * Asks for the current versions of the listed documents.
 *
 * @example
 * <TermsPrompt documents={pending} onAccept={() => accept.mutate()} isLoading={accept.isPending} />
 */
export function TermsPrompt({
  documents,
  onAccept,
  isLoading = false,
}: TermsPromptProps): ReactElement | null {
  const { t } = useTranslation();
  if (documents.length === 0) return null;
  return (
    <Card>
      <Card.Content>
        <Heading level={2}>{t("consent::ui.terms.title" as I18nKey)}</Heading>
        <Text>{t("consent::ui.terms.body" as I18nKey)}</Text>
        <ul>
          {documents.map((document) => (
            <li key={document.key}>
              <Link href={document.href}>{document.title}</Link>
            </li>
          ))}
        </ul>
      </Card.Content>
      <Card.Footer>
        <Button variant="primary" isLoading={isLoading} onPress={onAccept}>
          {t("consent::ui.terms.accept" as I18nKey)}
        </Button>
      </Card.Footer>
    </Card>
  );
}
