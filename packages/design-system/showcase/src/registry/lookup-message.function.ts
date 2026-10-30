/**
 * Stackra file contract:
 * Purpose: `lookupMessage`, the message a `showcase::a.b.c` key names in a nested catalogue object.
 * Boundary: a pure function; it reads the parsed JSON it is given and formats nothing.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 7.3.
 */

/** The string at `key` ("showcase::component.free.button.title") in `catalogue`, or undefined. */
export function lookupMessage(catalogue: unknown, key: string): string | undefined {
  const path = key.slice(key.indexOf("::") + 2).split(".");
  let node: unknown = catalogue;
  for (const segment of path) {
    if (node === null || typeof node !== "object") return undefined;
    node = (node as Record<string, unknown>)[segment];
  }
  return typeof node === "string" ? node : undefined;
}
