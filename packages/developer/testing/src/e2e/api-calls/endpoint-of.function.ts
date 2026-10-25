/**
 * Stackra file contract:
 * Purpose: `endpointOf(root, key)`, the HTTP endpoint of a versioned key the app consumes (`orders.order.create@1`):
 *          read from the app's `stackra.manifest.json` `consumes` list and the manifest of the service behind it.
 * Boundary: internal to `./e2e` (not exported). Reads files only. A consumed manifest path is relative to the
 *           repository root, which is the nearest folder above `root` where that path exists.
 * Runtime: node (Playwright)
 * Governing contract: ADR 0269 (decision 6); the manifest contract (`consumes`, `actions[].endpoint`).
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

/** The parts of the manifests this reads. */
type Manifest = {
  readonly consumes?: readonly { readonly manifest: string }[];
  readonly actions?: readonly {
    readonly key: string;
    readonly endpoint?: { readonly method: string; readonly path: string };
  }[];
};

/** The JSON document at `file`. */
const read = (file: string): Manifest => JSON.parse(readFileSync(file, "utf8")) as Manifest;

/** `relative` resolved against the nearest folder at or above `from` that has it. */
function locate(from: string, relative: string): string {
  for (let dir = from; ; dir = dirname(dir)) {
    const file = join(dir, relative);
    if (existsSync(file)) return file;
    if (dirname(dir) === dir) throw new Error(`apiCalls: no ${relative} above ${from}`);
  }
}

/**
 * The method and path of `key`.
 *
 * @throws RangeError when no consumed service declares `key` with an endpoint.
 * @example
 * endpointOf("/repo/apps/console", "orders.order.create@1"); // { method: "POST", path: "/orders" }
 */
export function endpointOf(
  root: string,
  key: string,
): { readonly method: string; readonly path: string } {
  for (const consumed of read(join(root, "stackra.manifest.json")).consumes ?? []) {
    const endpoint = read(locate(root, consumed.manifest)).actions?.find(
      (entry) => entry.key === key,
    )?.endpoint;
    if (endpoint !== undefined) return { method: endpoint.method, path: endpoint.path };
  }
  throw new RangeError(
    `apiCalls: "${key}" is no endpoint the app consumes (stackra.manifest.json consumes)`,
  );
}
