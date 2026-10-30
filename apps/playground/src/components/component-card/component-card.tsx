/**
 * Stackra file contract:
 * Purpose: the component card of the index, the category pages, the home's phone shelves and the recent row: a
 *          `Card` with the entry's readable 16:10 thumbnail (`ComponentThumbnail`), then the title with its status
 *          and single-platform chips and the one-line description; it lifts under the pointer (`.lift`). The whole
 *          card is one link to the page; a planned or native-only entry has no page and no link. `sm` is the micro
 *          chip of the recent and related rows.
 * Boundary: presentation only; the words come from the `showcase` catalogue.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 5; owner answer Q4 (live previews); STA-1371.
 */
import { componentKeys, webPath } from "@stackra/showcase";
import type { I18nKey } from "@stackra/i18n";
import { Card, Chip, Heading, Link, Text, useCatalogueText } from "@stackra/ui/react";
import { useLocation } from "react-router";

import { ComponentThumbnail } from "#src/components/component-thumbnail";
import { StatusChip } from "#src/components/status-chip";
import { MESSAGES } from "#src/constants/messages.constant";
import { SHOWCASE_KEYS } from "#src/constants/showcase-keys.constant";
import type { ComponentCardProps } from "#src/components/component-card/component-card.props";

/** The showcase keys. */
const K = SHOWCASE_KEYS.showcase;

/** The card of one registry entry. */
export function ComponentCard({ entry, size = "md" }: ComponentCardProps) {
  const t = useCatalogueText(MESSAGES.en);
  const { search } = useLocation();
  const keys = componentKeys(entry);
  const title = t(keys.title as I18nKey);
  const hasPage = entry.status !== "planned" && entry.platforms.includes("react");
  const href = hasPage ? `${webPath(entry)}${search}` : undefined;
  const only = entry.platforms.length === 1 ? entry.platforms[0] : undefined;

  const body =
    size === "sm" ? (
      <span className="grid w-30 gap-1">
        <Card className="aspect-[16/10] overflow-hidden p-0">
          <ComponentThumbnail entry={entry} scale={0.35} />
        </Card>
        <Text type="small" className="truncate text-center">
          {title}
        </Text>
      </span>
    ) : (
      <Card className="lift grid h-full w-full gap-0 overflow-hidden p-0">
        <div className="aspect-[16/10] border-b border-separator">
          <ComponentThumbnail entry={entry} />
        </div>
        {/* Above the preview, on the card's own surface: a tall demo's clipped overflow then never lies over the words. */}
        <div className="relative grid gap-1 bg-surface p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Heading level={3} type="h5" className="min-w-0 flex-1 truncate">
              {title}
            </Heading>
            <StatusChip status={entry.status} />
            {only ? (
              <Chip size="sm" variant="secondary">
                {t(K.platform_only[only])}
              </Chip>
            ) : null}
          </div>
          <Text type="small" tone="muted" className="line-clamp-1">
            <bdi>{t(keys.description as I18nKey)}</bdi>
          </Text>
        </div>
      </Card>
    );

  return href ? (
    <Link
      href={href}
      underline="hover"
      className="group block h-full w-full hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
    >
      {body}
    </Link>
  ) : (
    <div className="h-full w-full">{body}</div>
  );
}
