/**
 * Stackra file contract:
 * Purpose: `registerVisibility`, how gen's generated entry tells the query filter which models declare visibility,
 *          under which key their rules are stored, which fact source tests their attributes, and what a record no rule
 *          matches gets.
 * Boundary: writes the process-wide registry; a later row for a model replaces the earlier one. Checks each row
 *           against the model's `@Visibility` facet, so a wrong row fails at boot rather than on the first read: the
 *           rules register exactly the facet's attributes under `record`, a geo attribute is refused (a read cannot
 *           test it yet), each followed relation is a many-to-one whose target declares `@Visibility` too, and
 *           `unmatched` is stated (ADR 0333 decision 7 gives it no default).
 * Runtime: node
 * Governing contract: ADR 0333 (decisions 1, 4 and 7, and its amendment: relations); ADR 0331 (decision 4); ADR 0294
 *                     (decisions 10 and 22: what gen's entry registers).
 */
import { ManyToOne, Visibility } from "@stackra/model";
import { Rules } from "@stackra/rules";
import { FieldType } from "@stackra/rules/contracts";

import { Decision } from "#core/index";
import { VISIBILITY_REGISTRY } from "#node/constants/visibility-registry.constant";
import type { VisibilityRegistration } from "#node/types/visibility-registration.type";

/** A model key: a module key, a dot, a snake_case name (`catalogue.product`). */
const MODEL_KEY = /^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/;

/** Whether `rules` registers exactly `attributes` under `record`. */
function registersExactly(rules: Rules, attributes: readonly string[]): boolean {
  const paths = rules.fields().map((field) => field.path);
  return (
    paths.length === attributes.length &&
    attributes.every((attribute) => paths.includes(`record.${attribute}`))
  );
}

/**
 * Registers the visibility of each model.
 *
 * @throws TypeError when a row's model declares no `@Visibility`, its key is not a model key, its rules are not a
 *         `Rules` registry of exactly the facet's attributes under `record` (or are given for a facet with none), an
 *         attribute is a geo field, a followed relation is not a many-to-one to a model that declares `@Visibility`,
 *         or `unmatched` is not `Decision.Allow` or `Decision.Deny`.
 * @example
 * registerVisibility([{ model: Product, key: "catalogue.product", rules: PRODUCT_RULES, unmatched: Decision.Deny }]);
 */
export function registerVisibility(rows: readonly VisibilityRegistration[]): void {
  for (const row of rows) {
    const facet = typeof row.model === "function" ? Visibility.on(row.model) : undefined;
    const name = typeof row.model === "function" ? row.model.name : String(row.model);
    if (facet === undefined)
      throw new TypeError(`registerVisibility: ${name} declares no @Visibility`);
    if (!MODEL_KEY.test(row.key))
      throw new TypeError(`registerVisibility: "${row.key}" is not a model key`);
    if (row.unmatched !== Decision.Allow && row.unmatched !== Decision.Deny)
      throw new TypeError(`registerVisibility: state what ${name} shows a record no rule matches`);
    const attributes = facet.attributes ?? [];
    const rules = row.rules;
    if (
      attributes.length === 0
        ? rules !== undefined
        : !(rules instanceof Rules) || !registersExactly(rules, attributes)
    )
      throw new TypeError(
        `registerVisibility: the rules of ${name} must register exactly its @Visibility attributes under "record"`,
      );
    if (rules?.fields().some(({ field }) => field.type === FieldType.Geo) === true)
      throw new TypeError(`registerVisibility: a geo attribute of ${name} cannot filter a read`);
    const follows = (facet.follows ?? []).map((relation) => {
      const target = ManyToOne.members(row.model).get(relation)?.target();
      if (target === undefined || Visibility.on(target) === undefined)
        throw new TypeError(
          `registerVisibility: ${name} follows "${relation}", which is not a many-to-one to a model with @Visibility`,
        );
      return Object.freeze([relation, target] as const);
    });
    VISIBILITY_REGISTRY.set(row.model, {
      row: Object.freeze({ ...row }),
      follows: Object.freeze(follows),
    });
  }
}
