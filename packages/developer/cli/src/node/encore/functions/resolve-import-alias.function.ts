/**
 * Stackra file contract:
 * Purpose: `resolveImportAlias`, the file a member's `#` specifier names through its package.json `imports`, as Node and
 *          TypeScript read the map: an exact key or a key with one `*`, whose target (a string or a list of fallbacks)
 *          is tried in order, and the first target that is a file wins.
 * Boundary: pure apart from the `isFile` probe it is handed; no conditions object (`{ "node": … }`) is read, since a
 *           member's `imports` holds plain paths. A specifier no key matches, or whose targets name no file, is
 *           undefined, so the caller keeps it as written and reports it.
 * Runtime: node
 * Governing contract: ADR 0091 (decision 2, amendment of 2026-11-09: the staging copy); ADR 0233 (`#` imports).
 */
import { join } from "node:path";

/**
 * The file `specifier` resolves to in `memberDir`, or undefined.
 *
 * @param memberDir - the member's directory, which holds its package.json.
 * @param imports - the member's package.json `imports`.
 * @param specifier - a `#` specifier, such as `#modules/orders/actions/cancel-order.action`.
 * @param isFile - whether a path is an existing file.
 * @example
 * resolveImportAlias("/repo/services/orders", { "#modules/*": ["./src/modules/*.ts"] }, "#modules/orders/x", isFile);
 * // "/repo/services/orders/src/modules/orders/x.ts"
 */
export function resolveImportAlias(
  memberDir: string,
  imports: Readonly<Record<string, unknown>>,
  specifier: string,
  isFile: (path: string) => boolean,
): string | undefined {
  for (const [key, value] of Object.entries(imports)) {
    const star = key.indexOf("*");
    let rest: string;
    if (star === -1) {
      if (specifier !== key) continue;
      rest = "";
    } else {
      const head = key.slice(0, star);
      const tail = key.slice(star + 1);
      if (!specifier.startsWith(head) || !specifier.endsWith(tail)) continue;
      if (specifier.length < head.length + tail.length) continue;
      rest = specifier.slice(head.length, specifier.length - tail.length);
    }
    const targets = (Array.isArray(value) ? value : [value]).filter(
      (target): target is string => typeof target === "string",
    );
    for (const target of targets) {
      const path = join(memberDir, target.replaceAll("*", rest));
      if (isFile(path)) return path;
    }
  }
  return undefined;
}
