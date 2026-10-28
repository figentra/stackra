/**
 * Stackra file contract:
 * Purpose: `SHAPE_DECORATORS`, the field decorators the shape compiler reads itself (constraints, the zod hatch,
 *          renames, classification, secret references, serializers and relations), so discovery never lists them as
 *          facets.
 * Boundary: a frozen list of decorator names; every other decorator made by `createDecorator` is a facet.
 * Runtime: node
 * Governing contract: ADR 0294 (R6 and decision 6: the decorator categories); ADR 0305 (rule 34).
 */

/** The decorators that belong to shapes, not facets. */
export const SHAPE_DECORATORS: readonly string[] = Object.freeze([
  "Classified",
  "Field",
  "Hidden",
  "Int",
  "List",
  "Lowercase",
  "ManyToMany",
  "ManyToOne",
  "Num",
  "OneToMany",
  "OneToOne",
  "Renamed",
  "Secret",
  "Str",
  "Trim",
  "Visible",
]);
