/**
 * Stackra file contract:
 * Purpose: `decodeResource(key, wire, refOf)`, a resource tree sent as JSON turned back into the `ResourceTree` the
 *          resource pages draw: checked against `ResourceWire$`, every versioned key replaced by the client ref
 *          `refOf` answers for it, every enum definition built with `Enum.of`.
 * Boundary: pure apart from `refOf`; all or nothing. A tree that fails the schema, or names a key `refOf` has no ref
 *           for, is refused with `ResourceWireInvalidError`, listing every problem. A manifest entry decodes as it is
 *           (its `module`, `class` and `from` are dropped). The tree and its node lists are frozen, as `describeResource`
 *           freezes them.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 5 and 7); ADR 0164 (decision 2); ADR 0140 (refusals); the SDUI catalogue case
 *                     `resources` (STA-1981, build-list item 54).
 */
import type { AnyClass } from "@stackra/container";
import { Enum } from "@stackra/contracts";

import { RESOURCE_WIRE_SCHEMA } from "#core/constants/resource-wire-schema.constant";
import { ResourceWireInvalidError } from "#core/errors/resource-wire-invalid.error";
import type { ColumnNode } from "#core/types/column-node.type";
import type { EntryNode } from "#core/types/entry-node.type";
import type { FieldNode } from "#core/types/field-node.type";
import type { FilterNode } from "#core/types/filter-node.type";
import type { PlacementNode } from "#core/types/placement-node.type";
import type { RelationNode } from "#core/types/relation-node.type";
import type { ResourceOperations } from "#core/types/resource-operations.type";
import type { ResourceTree } from "#core/types/resource-tree.type";
import type { ResourceWire } from "#core/types/resource-wire.type";
import type { Wire } from "#core/types/wire.type";

/** `items` mapped by `each`, frozen; undefined stays undefined. */
const listOf = <W, N>(
  items: readonly W[] | undefined,
  each: (item: W, index: number) => N,
): readonly N[] | undefined => (items === undefined ? undefined : Object.freeze(items.map(each)));

/** `node` with its enum definition built, when it has one. */
const withEnum = <N extends { readonly enum?: Enum.Definition }>(
  node: N,
): Omit<N, "enum"> & { readonly enum?: Enum.Any } => {
  const { enum: definition, ...rest } = node;
  return definition === undefined ? rest : { ...rest, enum: Enum.of(definition) };
};

/** A column with its enum built. */
const column = (node: Wire<ColumnNode>): ColumnNode => Object.freeze(withEnum(node));

/** A filter with its enum built. */
const filter = (node: Wire<FilterNode>): FilterNode =>
  Object.freeze(node.kind === "trashed" ? node : withEnum(node));

/** An infolist element with its enums built, sections included. */
const entry = (node: Wire<EntryNode>): EntryNode => {
  switch (node.kind) {
    case "value":
    case "principal": {
      return Object.freeze(withEnum(node));
    }
    case "section": {
      return Object.freeze({ ...node, entries: Object.freeze(node.entries.map(entry)) });
    }
    default: {
      return Object.freeze(node);
    }
  }
};

/**
 * The resource tree `wire` sends for the resource `key`.
 *
 * @param refOf - the client ref of a versioned action or query key; undefined when the client has none.
 * @throws ResourceWireInvalidError when `wire` is not a resource tree or names a key `refOf` has no ref for.
 * @example
 * const refs = new Map([[CancelOrderAction.key, CancelOrderAction]]);
 * registerResources({ "orders.order": decodeResource("orders.order", manifest.ui.resources["orders.order"], (k) => refs.get(k)) });
 */
export function decodeResource(
  key: string,
  wire: unknown,
  refOf: (key: string) => AnyClass | undefined,
): ResourceTree {
  const parsed = RESOURCE_WIRE_SCHEMA.safeParse(wire);
  if (!parsed.success)
    throw ResourceWireInvalidError.create({
      resource: key,
      issues: parsed.error.issues.map(
        (issue) => `${["tree", ...issue.path.map(String)].join(".")}: ${issue.message}`,
      ),
    });
  // The schema checked the shape, so the parsed value is the wire type it describes.
  const tree = parsed.data as unknown as ResourceWire;

  const issues: string[] = [];
  const ref = (versioned: string, path: string): AnyClass => {
    const type = refOf(versioned);
    if (type === undefined) issues.push(`${path}: no client ref for "${versioned}"`);
    // A missing ref is reported below, before anything is returned.
    return type as AnyClass;
  };

  const field = (node: Wire<FieldNode>, path: string): FieldNode => {
    switch (node.kind) {
      case "value": {
        const { options, ...rest } = withEnum(node);
        return Object.freeze(
          options === undefined ? rest : { ...rest, options: ref(options, `${path}.options`) },
        );
      }
      case "upload": {
        return Object.freeze({ ...node, action: ref(node.action, `${path}.action`) });
      }
      case "repeater":
      case "grid": {
        const fields = listOf(node.fields, (item, index) => field(item, `${path}.fields.${index}`));
        return Object.freeze({ ...node, fields: fields ?? [] });
      }
      case "steps": {
        return Object.freeze({
          ...node,
          steps: Object.freeze(
            node.steps.map((step, at) =>
              Object.freeze({
                ...step,
                fields: Object.freeze(
                  step.fields.map((item, index) =>
                    field(item, `${path}.steps.${at}.fields.${index}`),
                  ),
                ),
              }),
            ),
          ),
        });
      }
    }
  };

  const relation = (node: Wire<RelationNode>, path: string): RelationNode => {
    const { actions, ...rest } = node;
    const refs = listOf(actions, (action, index) => ref(action, `${path}.actions.${index}`));
    return Object.freeze({
      ...rest,
      query: ref(node.query, `${path}.query`),
      columns: Object.freeze(node.columns.map(column)),
      ...(refs === undefined ? {} : { actions: refs }),
    });
  };

  const placement = (node: Wire<PlacementNode>, path: string): PlacementNode =>
    Object.freeze(
      node.kind === "run" ? { ...node, action: ref(node.action, `${path}.action`) } : node,
    );

  const operations: ResourceOperations = Object.freeze(
    Object.fromEntries(
      Object.entries(tree.options.operations).flatMap(([name, value]) =>
        value === undefined
          ? []
          : [[name, value === true ? true : ref(value, `tree.options.operations.${name}`)]],
      ),
    ),
  );

  const { table, views, form, infolist, relations, actions } = tree;
  const decoded: ResourceTree = Object.freeze({
    options: Object.freeze({ ...tree.options, operations }),
    ...(table === undefined
      ? {}
      : {
          table: Object.freeze({
            ...table,
            columns: Object.freeze(table.columns.map(column)),
            filters: Object.freeze(table.filters.map(filter)),
          }),
        }),
    ...(views === undefined
      ? {}
      : { views: Object.freeze(views.map((view) => Object.freeze(view))) }),
    ...(form === undefined
      ? {}
      : {
          form: Object.freeze({
            fields: Object.freeze(
              form.fields.map((item, index) => field(item, `tree.form.fields.${index}`)),
            ),
          }),
        }),
    ...(infolist === undefined
      ? {}
      : { infolist: Object.freeze({ entries: Object.freeze(infolist.entries.map(entry)) }) }),
    ...(relations === undefined
      ? {}
      : {
          relations: Object.freeze(
            relations.map((item, index) => relation(item, `tree.relations.${index}`)),
          ),
        }),
    ...(actions === undefined
      ? {}
      : {
          actions: Object.freeze(
            actions.map((item, index) => placement(item, `tree.actions.${index}`)),
          ),
        }),
  });
  if (issues.length > 0) throw ResourceWireInvalidError.create({ resource: key, issues });
  return decoded;
}
