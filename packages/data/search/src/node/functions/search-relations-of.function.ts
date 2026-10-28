/**
 * Stackra file contract:
 * Purpose: `searchRelationsOf`, the related models a `@Searchable` model's documents read: each relation hop of each
 *          dotted text or filter path (`variants.sku` gives `Variant` via `["variants"]`, reading `sku`).
 * Boundary: reads the facet and the model's relation decorators (`@OneToMany`, `@ManyToOne`, `@ManyToMany`,
 *           `@OneToOne`, through base models); a path segment that is no relation (a scalar or an embedded value) ends
 *           the walk. Hops through the same relations merge their read fields; a hop also reads the child's own
 *           relation fields, since changing one moves the child to another parent.
 * Runtime: node
 * Governing contract: ADR 0221 (decision 5); ADR 0294 (decision 6: `@Searchable` is a class facet); data-layer gap se4.
 */
import type { AnyClass } from "@stackra/container";
import { ManyToMany, ManyToOne, OneToMany, OneToOne, Searchable } from "@stackra/model";

import type { SearchRelation } from "#node/types/search-relation.type";

/** The relation decorators whose records name a target model. */
const RELATIONS = [OneToMany, ManyToOne, ManyToMany, OneToOne];

/** The model `field` of `model` relates to, or undefined when it is no relation. */
function targetOf(model: AnyClass, field: string): AnyClass | undefined {
  for (const relation of RELATIONS) {
    const definition = relation.members(model).get(field);
    if (definition !== undefined) return definition.target();
  }
  return undefined;
}

/** The relation fields of `model`. */
const relationFieldsOf = (model: AnyClass): readonly string[] =>
  RELATIONS.flatMap((relation) =>
    [...relation.members(model).keys()].filter((key): key is string => typeof key === "string"),
  );

/**
 * The relation hops of `model`'s facet.
 *
 * @example
 * searchRelationsOf(Product); // [{ parent: Product, child: Variant, via: ["variants"], reads: Set { "sku" } }]
 */
export function searchRelationsOf(model: AnyClass): readonly SearchRelation[] {
  const facet = Searchable.on(model);
  if (facet === undefined) return [];
  const hops = new Map<string, { child: AnyClass; via: string[]; reads: Set<string> }>();
  for (const path of [...facet.text, ...(facet.filters ?? [])]) {
    const segments = path.split(".");
    let at: AnyClass = model;
    for (let depth = 0; depth < segments.length - 1; depth += 1) {
      const child = targetOf(at, segments[depth] ?? "");
      if (child === undefined) break;
      const via = segments.slice(0, depth + 1);
      const key = via.join(".");
      // A changed relation field moves the child to another parent, so it counts as read too.
      const hop = hops.get(key) ?? { child, via, reads: new Set(relationFieldsOf(child)) };
      hop.reads.add(segments[depth + 1] ?? "");
      hops.set(key, hop);
      at = child;
    }
  }
  return [...hops.values()].map((hop) => ({ parent: model, ...hop }));
}
