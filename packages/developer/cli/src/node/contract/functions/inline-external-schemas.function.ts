/**
 * Stackra file contract:
 * Purpose: `inlineExternalSchemas(document, manifestOf)`, an OpenAPI projection made self-contained for `oasdiff`: a
 *          member that mounts another package's actions references that package's shapes as
 *          `<package>#/schemas/<name>`, which `oasdiff` would try to open as a file. Each such reference (and every
 *          `#/schemas/` reference inside the shape it brings in, transitively) becomes a local
 *          `#/components/schemas/<key>`, with the shape copied from that package's manifest, so a change to a mounted
 *          package's shape is a change to the host's contract too. A shape no manifest holds becomes a schema that
 *          only names it (`x-stackra-unresolved`), which compares equal on both sides.
 * Boundary: pure; returns a new document and leaves `document` as it was.
 * Runtime: node
 * Governing contract: ADR 0182 (decision 4: `oasdiff` contract checks); ADR 0158 (openapi.json is a projection of the
 *                     manifest); STA-2837.
 */
import type { StackraManifest } from "@stackra/contracts";
import type { OpenApiDocument } from "@stackra/gen";

/** A reference into another package's manifest shapes. */
const EXTERNAL = /^([^#]+)#\/schemas\/(.+)$/;

/** A reference into the shapes of the manifest the value came from. */
const OWN = "#/schemas/";

/** The component key of `name` from `pkg`, in the characters OpenAPI allows (`_stackra_identity.identity.X`). */
function keyOf(pkg: string, name: string): string {
  return `${pkg}.${name}`.replaceAll(/[^\w.-]/g, "_");
}

/**
 * `document` with every external shape reference resolved into its own components.
 *
 * @param document - a member's OpenAPI projection.
 * @param manifestOf - the manifest of a package, on the same side of the comparison, or `undefined`.
 * @example
 * inlineExternalSchemas(openApiOf(host), (pkg) => manifests.get(pkg));
 */
export function inlineExternalSchemas(
  document: OpenApiDocument,
  manifestOf: (packageName: string) => StackraManifest | undefined,
): OpenApiDocument {
  const pending: (readonly [string, string])[] = [];
  const queued = new Set<string>();
  const rewrite = (value: unknown, owner?: string): unknown => {
    if (Array.isArray(value)) return value.map((item) => rewrite(item, owner));
    if (typeof value !== "object" || value === null) return value;
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => {
        if (key !== "$ref" || typeof item !== "string") return [key, rewrite(item, owner)];
        const external = EXTERNAL.exec(item);
        const target: readonly [string, string] | undefined =
          external !== null
            ? [external[1] ?? "", external[2] ?? ""]
            : owner !== undefined && item.startsWith(OWN)
              ? [owner, item.slice(OWN.length)]
              : undefined;
        if (target === undefined) return [key, item];
        const component = keyOf(...target);
        if (!queued.has(component)) {
          queued.add(component);
          pending.push(target);
        }
        return [key, `#/components/schemas/${component}`];
      }),
    );
  };
  const paths = rewrite(document.paths) as OpenApiDocument["paths"];
  const schemas = { ...(rewrite(document.components.schemas) as Record<string, unknown>) };
  for (let next = pending.shift(); next !== undefined; next = pending.shift()) {
    const [pkg, name] = next;
    const shape = (manifestOf(pkg)?.schemas as Record<string, unknown> | undefined)?.[name];
    schemas[keyOf(pkg, name)] =
      shape === undefined
        ? { "x-stackra-unresolved": `${pkg}#/schemas/${name}` }
        : rewrite(shape, pkg);
  }
  return {
    ...document,
    paths,
    components: {
      ...document.components,
      schemas: schemas as OpenApiDocument["components"]["schemas"],
    },
  };
}
