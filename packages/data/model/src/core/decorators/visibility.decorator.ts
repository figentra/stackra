/**
 * Stackra file contract:
 * Purpose: `@Visibility(options)`, the class facet by which a model declares record visibility: which of its records a
 *          principal may see, list or use is decided by visibility rules (an audience, a capability and a condition
 *          over the attributes it names), and every read of it carries the resulting filter.
 * Boundary: made with `createDecorator`, so it records metadata only; one per model. It declares, and decides nothing:
 *           the rules are IAM's data, evaluated by its policy decision point and pushed into reads by its
 *           `VisibilityFilter` driver (`@stackra/iam/node`), on top of row-level security and never instead of it. Names
 *           are checked here for shape and by gen against the model. It may mark the model kinds only.
 * Runtime: isomorphic
 * Governing contract: ADR 0333 (decisions 1, 4 and 5, and its amendment); ADR 0294 (decision 6: class facets).
 */
import { createDecorator, DecoratorTarget } from "@stackra/container";
import type { DecoratorFunction } from "@stackra/container";

import { MODEL_KINDS } from "#core/constants/model-kinds.constant";
import type { VisibilityOptions } from "#core/types/visibility-options.type";

/** A camelCase property name, as a rules field key takes it. */
const PROPERTY = /^[a-z][a-zA-Z0-9]{0,62}$/;

/** The recording decorator; `Visibility` gives it its options. */
const VISIBILITY = createDecorator<VisibilityOptions>({
  kind: "visibility",
  target: DecoratorTarget.Class,
  kinds: MODEL_KINDS,
});

/** `names` frozen, after checking each is a distinct camelCase property name. */
function namesOf(option: string, names: readonly string[]): readonly string[] {
  for (const name of names)
    if (!PROPERTY.test(name))
      throw new TypeError(`@Visibility: "${name}" in ${option} is not a camelCase property name`);
  if (new Set(names).size !== names.length)
    throw new TypeError(`@Visibility: ${option} names a property twice`);
  return Object.freeze([...names]);
}

/**
 * Declares that a model's records are visible by rule.
 *
 * @throws TypeError when neither list names a property, a name is not a camelCase property name or is repeated; at
 *         class definition, when applied to anything but a model class.
 * @example
 * ```ts
 * @Visibility({ attributes: ["collection", "status"] })
 * export class Product extends Model.with(HasPublicId("prd")) {}
 *
 * @Visibility({ attributes: ["confidential"], follows: ["matter"] }) // visible only when its matter is
 * export class Document extends Model.with(HasPublicId("doc")) {}
 * ```
 */
export function Visibility(options: VisibilityOptions): DecoratorFunction {
  const attributes = namesOf("attributes", options.attributes ?? []);
  const follows = namesOf("follows", options.follows ?? []);
  if (attributes.length + follows.length === 0)
    throw new TypeError("@Visibility needs an attribute or a followed relation");
  return VISIBILITY(
    Object.freeze({
      ...(attributes.length === 0 ? {} : { attributes }),
      ...(follows.length === 0 ? {} : { follows }),
    }),
  );
}

/** The visibility declared on a class or its nearest decorated ancestor; undefined when it has none. */
Visibility.on = VISIBILITY.on;
