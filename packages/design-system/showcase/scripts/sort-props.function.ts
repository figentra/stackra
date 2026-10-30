/**
 * Stackra file contract:
 * Purpose: `sortProps`, the API table order: contract props in declaration order, then heroui A-Z, react-aria A-Z, then the folded `...Base` rows.
 * Boundary: a pure function.
 * Runtime: node
 * Governing contract: showcase redesign spec (2026-10-27) section 7.2.
 */
import type { ApiProp } from "../src/types/api-prop.type.ts";

const SOURCES: readonly ApiProp["source"][] = ["stackra", "heroui", "react-aria"];

function rank(prop: ApiProp): number {
  return prop.name.startsWith("...") ? SOURCES.length : SOURCES.indexOf(prop.source);
}

/** A sorted copy of `props`. */
export function sortProps(props: readonly ApiProp[]): ApiProp[] {
  return props
    .map((prop, index) => ({ prop, index }))
    .toSorted(
      (a, b) =>
        rank(a.prop) - rank(b.prop) ||
        (rank(a.prop) === 0 ? a.index - b.index : a.prop.name.localeCompare(b.prop.name)),
    )
    .map(({ prop }) => prop);
}
