/**
 * Stackra file contract:
 * Purpose: `describeResource(Resource)`, what gen records for one resource class: its options and the node each overridden
 *          builder member returns, run once on a fresh builder.
 * Boundary: pure: the members run on an object with the class's prototype, so no constructor (and no dependency) runs; a
 *           member that reads anything but its argument is impure (gen fails `builder_impure`).
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 5 and 7).
 */
import { kindOf, type AnyClass } from "@stackra/container";

import type { ResourceBase } from "#core/bases/resource-base.base";
import { ActionsRecord } from "#core/records/actions.record";
import { FormRecord } from "#core/records/form.record";
import { InfolistRecord } from "#core/records/infolist.record";
import { RelationsRecord } from "#core/records/relations.record";
import { TableRecord } from "#core/records/table.record";
import { ViewsRecord } from "#core/records/views.record";
import type { Built } from "#core/types/built.type";
import type { ResourceOptions } from "#core/types/resource-options.type";
import type { ResourceTree } from "#core/types/resource-tree.type";

/** The frozen nodes of `steps`, or undefined. */
const nodesOf = <N>(steps: readonly Built<N>[] | undefined): readonly N[] | undefined =>
  steps === undefined ? undefined : Object.freeze(steps.map((step) => step.toNode()));

/**
 * The recorded tree of `type`.
 *
 * @throws TypeError when `type` is not a resource class.
 * @example
 * describeResource(OrderResource).table?.defaultSort; // { key: "createdAt", direction: "desc" }
 */
export function describeResource(type: AnyClass): ResourceTree {
  const record = kindOf(type);
  if (record?.kind !== "resource")
    throw new TypeError(`describeResource: ${type.name} does not extend Resource<Model>({ ... })`);
  const self = Object.create(type.prototype as object) as ResourceBase<object, object>;
  const table = self.table(new TableRecord<object>())?.toNode();
  const views = nodesOf(self.views(new ViewsRecord<object>()));
  // The base's `form` parameter is `never` (the override types it), so the record is handed over as such.
  const form = self.form(new FormRecord<never>() as never)?.toNode();
  const infolist = self.infolist(new InfolistRecord<object>())?.toNode();
  const relations = nodesOf(self.relations(new RelationsRecord<object>()));
  const actions = nodesOf(self.actions(new ActionsRecord<object, object>()));
  return Object.freeze({
    options: record.options as unknown as ResourceOptions,
    ...(table === undefined ? {} : { table }),
    ...(views === undefined ? {} : { views }),
    ...(form === undefined ? {} : { form }),
    ...(infolist === undefined ? {} : { infolist }),
    ...(relations === undefined ? {} : { relations }),
    ...(actions === undefined ? {} : { actions }),
  });
}
