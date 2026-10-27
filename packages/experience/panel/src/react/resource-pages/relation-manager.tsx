/**
 * Stackra file contract:
 * Purpose: `RelationManager`, one relation on a View page: a titled section holding the related list query's table,
 *          its input bound from the record (`{ orderId: "record.id" }`).
 * Boundary: draws `ResourceTable` with the relation's columns and no filters or bulk bar; the title is the derived
 *           label of the related model (`<module>::resources.<model>.relations.<related>`). Attach, detach and inline
 *           create are not built.
 * Runtime: browser
 * Governing contract: ADR 0307 (relation keys come from the get output; binds); ADR 0164.
 */
import type { QueryRef } from "@stackra/clients";
import { useTranslation } from "@stackra/i18n/react";
import { Section } from "@stackra/ui/react";
import type { ReactElement } from "react";

import { Count } from "#core/enums/count.enum";
import { resourceLabel } from "#core/functions/resource-label.function";
import { valueAt } from "#core/functions/value-at.function";
import type { RelationManagerProps } from "#react/resource-pages/relation-manager.props";
import { ResourceTable } from "#react/resource-pages/resource-table";

/**
 * The related rows of `record`.
 *
 * @example
 * <RelationManager resourceKey="orders.order" relation={tree.relations[0]} record={order} />
 */
export function RelationManager({
  resourceKey,
  relation,
  record,
  pageSize = 10,
}: RelationManagerProps): ReactElement {
  const { t } = useTranslation();
  const query = relation.query as QueryRef;
  const related = query.key.split(".")[1] ?? query.key;
  const title = t(resourceLabel(resourceKey, "relations", related));
  const input = Object.fromEntries(
    Object.entries(relation.bind ?? {}).map(([key, path]) => [key, valueAt({ record }, path)]),
  );
  return (
    <Section title={title}>
      <ResourceTable
        resourceKey={resourceKey}
        label={title}
        query={query}
        input={input}
        table={{ columns: relation.columns, filters: [], count: Count.Estimated }}
        pageSize={pageSize}
        searchable={false}
      />
    </Section>
  );
}
