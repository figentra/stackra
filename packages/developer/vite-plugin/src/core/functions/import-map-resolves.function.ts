/**
 * Stackra file contract:
 * Purpose: `importMapResolves`, whether an import map resolves a bare specifier: an exact key, or a key ending in `/`
 *          that prefixes it (the WHATWG rule), so `react/` covers `react/jsx-runtime`.
 * Boundary: pure; relative, absolute, `#`-imports, `\0`-virtual and scheme specifiers (`node:`, `virtual:`) are never
 *           resolved, since a browser import map never sees them.
 * Runtime: node
 * Governing contract: ADR 0436 (decision 4); app-shells-edge-and-extension.md 4.1.
 */
import type { ImportMap } from "#core/types/import-map.type";

/**
 * Whether `map` resolves `specifier`.
 *
 * @example
 * importMapResolves({ imports: { react: "/r.js", "react/": "/r/" } }, "react/jsx-runtime"); // true
 */
export function importMapResolves(map: ImportMap, specifier: string): boolean {
  if (/^[./#\0]/.test(specifier) || /^[a-z][a-z0-9+.-]*:/i.test(specifier)) return false;
  return Object.keys(map.imports).some(
    (key) => key === specifier || (key.endsWith("/") && specifier.startsWith(key)),
  );
}
