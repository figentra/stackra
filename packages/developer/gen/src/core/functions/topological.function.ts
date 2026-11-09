/**
 * Stackra file contract:
 * Purpose: `topological`, sorts keys so each comes after the keys it depends on; a cycle keeps source order. The
 *          module order of the wiring, the manifest's `seeders` section and the seed entry (STA-2061).
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: ADR 0190 (seeders run in the order their imports imply); ADR 0263 (module graph).
 */

/**
 * `keys` sorted after their dependencies.
 *
 * @param keys - the keys in source order.
 * @param edges - key to the keys it depends on; a dependency outside `keys` is ignored.
 * @example
 * topological(["a", "b"], new Map([["a", ["b"]]])); // ["b", "a"]
 */
export function topological(
  keys: readonly string[],
  edges: ReadonlyMap<string, readonly string[]>,
): string[] {
  const out: string[] = [];
  const state = new Map<string, "visiting" | "done">();
  const visit = (key: string): void => {
    if (state.has(key)) return;
    state.set(key, "visiting");
    for (const dependency of edges.get(key) ?? []) if (keys.includes(dependency)) visit(dependency);
    state.set(key, "done");
    out.push(key);
  };
  for (const key of keys) visit(key);
  return out;
}
