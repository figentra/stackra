/**
 * Stackra file contract:
 * Purpose: `applyReplaces`, set `ApiProp.replaces` where REPLACED_PROPS maps a refused HeroUI name to a prop the part has.
 * Boundary: a pure function.
 * Runtime: node
 * Governing contract: showcase redesign spec (2026-10-27) section 7.2.
 */
import type { ApiProp } from "../src/types/api-prop.type.ts";
import { REPLACED_PROPS } from "./replaced-props.ts";

/** `props` with `replaces` on each contract prop that stands in for one of `omitted`. */
export function applyReplaces(props: readonly ApiProp[], omitted: readonly string[]): ApiProp[] {
  const replaced = new Map<string, string>();
  for (const hero of omitted) {
    const target = REPLACED_PROPS[hero]?.find((name) => props.some((prop) => prop.name === name));
    if (target && !replaced.has(target)) replaced.set(target, hero);
  }
  return props.map((prop) => {
    const hero = replaced.get(prop.name);
    return hero ? { ...prop, replaces: hero } : prop;
  });
}
