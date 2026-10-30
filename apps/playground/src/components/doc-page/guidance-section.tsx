/**
 * Stackra file contract:
 * Purpose: `GuidanceSection`, the doc-page guidance of an entry with a `COMPONENT_DOCS` row: when not to use it, the
 *          do and don't cards, the numbered anatomy parts and the alternatives with the reason to reach for each.
 * Boundary: presentation over `docKeys(entry)`; renders nothing for an entry without a row.
 * Runtime: browser
 * Governing contract: STA-1371 (doc pages wave, owner approval 2026-10-28).
 */
import type { I18nKey } from "@stackra/i18n";
import {
  bySlug,
  componentKeys,
  docKeys,
  webPath,
  type ComponentEntry,
  type ComponentTier,
} from "@stackra/showcase";
import { Card, Chip, Heading, Icon, Link, Text, useCatalogueText } from "@stackra/ui/react";
import { useLocation } from "react-router";

import { DOC_PAGE_KEYS } from "#src/components/doc-page/doc-page-keys.constant";
import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";

const K = DOC_PAGE_KEYS.showcase.doc.ui;

/** The guidance of `entry`. */
export function GuidanceSection({ entry }: { readonly entry: ComponentEntry }) {
  const t = useCatalogueText(MESSAGES.en);
  const { search } = useLocation();
  const doc = docKeys(entry);
  if (!doc.whenNot) return null;
  const rules = [
    { id: "do", title: t(K.do), icon: Icons.CircleCheck, tone: "border-success", keys: doc.do },
    { id: "dont", title: t(K.dont), icon: Icons.CircleX, tone: "border-danger", keys: doc.dont },
  ] as const;
  return (
    <div className="grid gap-6">
      <div className="grid gap-1">
        <Heading level={3}>{t(K.when_not)}</Heading>
        <Text className="max-w-prose">
          <bdi>{t(doc.whenNot as I18nKey)}</bdi>
        </Text>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {rules.map((rule) => (
          <li key={rule.id} className="grid">
            <Card className={`grid content-start gap-2 border-t-4 p-4 ${rule.tone}`}>
              <div className="flex items-center gap-2">
                <Icon name={rule.icon} size="sm" />
                <Heading level={4}>{rule.title}</Heading>
              </div>
              <ul className="grid list-disc gap-1 ps-5">
                {rule.keys.map((key) => (
                  <li key={key}>
                    <Text type="small">
                      <bdi>{t(key as I18nKey)}</bdi>
                    </Text>
                  </li>
                ))}
              </ul>
            </Card>
          </li>
        ))}
      </ul>
      {doc.anatomy.length > 0 ? (
        <div className="grid gap-2">
          <Heading level={3}>{t(K.anatomy_parts)}</Heading>
          <ol className="flex flex-wrap gap-2">
            {doc.anatomy.map((part, index) => (
              <li key={part.id}>
                <Chip size="sm" variant="soft" tone="accent">
                  {`${index + 1}. ${t(part.label as I18nKey)}`}
                </Chip>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
      {doc.alternatives.length > 0 ? (
        <div className="grid gap-2">
          <Heading level={3}>{t(K.alternatives)}</Heading>
          <ul className="grid gap-2">
            {doc.alternatives.map(({ key, reason }) => {
              const [tier, slug] = key.split("/") as [ComponentTier, string];
              const other = bySlug(tier, slug);
              if (!other) return null;
              return (
                <li key={key} className="flex flex-wrap items-baseline gap-x-2">
                  <Link href={`${webPath(other)}${search}`} underline="hover">
                    {t(componentKeys(other).title as I18nKey)}
                  </Link>
                  <Text type="small" tone="muted">
                    <bdi>{t(reason as I18nKey)}</bdi>
                  </Text>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
