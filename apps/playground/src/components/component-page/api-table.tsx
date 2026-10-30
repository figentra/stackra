/**
 * Stackra file contract:
 * Purpose: `ApiTable`, the API of one part: "<Part> Props" (what it extends), then its render props, events (folded,
 *          there are dozens of DOM handlers) and native animation options, each a `PropsTable`.
 * Boundary: one part; the page lists the parts in registry order under "API Reference".
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (row 9).
 */
import { Button, Heading, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";

import { apiAnchor } from "#src/components/component-page/api-anchor.function";
import type { ApiTableProps } from "#src/components/component-page/api-table.props";
import { COMPONENT_PAGE_KEYS } from "#src/components/component-page/component-page-keys.constant";
import { PropsTable } from "#src/components/component-page/props-table";
import { MESSAGES } from "#src/constants/messages.constant";

const K = COMPONENT_PAGE_KEYS.showcase.api;

/** The tables of one part. */
export function ApiTable({ part }: ApiTableProps) {
  const t = useCatalogueText(MESSAGES.en);
  const [showsEvents, setShowsEvents] = useState(false);
  const title = t(K.props_of, { part: part.name });
  const id = apiAnchor(part.name);
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="grid gap-3 scroll-mt-24">
      <Heading id={`${id}-title`} level={3}>
        {title}
      </Heading>
      {part.extends ? (
        <Text type="small" tone="muted">
          {t(K.extends, { base: part.extends })}
        </Text>
      ) : null}
      <PropsTable label={title} rows={part.props} />
      {part.renderProps?.length ? (
        <>
          <Heading level={4}>{`${part.name} ${t(K.render_props)}`}</Heading>
          <PropsTable
            label={`${part.name} ${t(K.render_props)}`}
            rows={part.renderProps}
            hasDefault={false}
          />
        </>
      ) : null}
      {part.events?.length ? (
        <>
          <Heading level={4}>{t(K.events)}</Heading>
          <Button
            variant="ghost"
            size="sm"
            aria-expanded={showsEvents}
            onPress={() => setShowsEvents((shown) => !shown)}
            className="justify-self-start"
          >
            {`${t(K.events)} (${part.events.length})`}
          </Button>
          {showsEvents ? (
            <PropsTable label={t(K.events)} rows={part.events} hasDefault={false} />
          ) : null}
        </>
      ) : null}
      {part.animation?.length ? (
        <>
          <Heading level={4}>{`${part.name}${t(K.animation)}`}</Heading>
          <PropsTable label={`${part.name} ${t(K.animation)}`} rows={part.animation} />
        </>
      ) : null}
    </section>
  );
}
