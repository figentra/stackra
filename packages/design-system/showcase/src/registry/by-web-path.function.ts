/**
 * Stackra file contract:
 * Purpose: `byWebPath`, the entry a playground path names (the reverse of `webPath`).
 * Boundary: a pure function over the registry.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.2.
 */
import { COMPONENTS } from "#src/registry/components.generated";
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The entry at `path` ("/button", "/pro-kanban"), or undefined when no entry lives there. */
export function byWebPath(
  path: string,
  entries: readonly ComponentEntry[] = COMPONENTS,
): ComponentEntry | undefined {
  const segment = path.replaceAll(/^\/+|\/+$/g, "");
  return (
    entries.find((entry) => entry.tier === "free" && entry.slug === segment) ??
    entries.find((entry) => entry.tier === "pro" && `pro-${entry.slug}` === segment)
  );
}
