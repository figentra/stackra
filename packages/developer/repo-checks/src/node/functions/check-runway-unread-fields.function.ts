/**
 * Stackra file contract:
 * Purpose: `checkRunwayUnreadFields(read, files, fields?)`, that the runway fields set but not read yet stay honest:
 *          each listed field's canonical schema description says `Not read yet (<reader>)`, every description that
 *          says "Not read yet" is listed, and no reader source accesses a listed field. A field that gains a reader
 *          leaves the list and its description in the same change.
 * Boundary: pure apart from `read`, which returns a repository file's text or undefined when absent. The reader
 *           sources are runway, the CLI, gen, the infra packages and `tools/scripts`, without tests, schema constants
 *           and types; comment lines are skipped. Descriptions are read at each use site, so a `$ref`'d definition
 *           shared with a read field stays unmarked.
 * Runtime: node
 * Governing contract: ADR 0296; STA-2001 (Runway plan PR 6c).
 */
import { RUNWAY_UNREAD_FIELDS } from "#node/constants/runway-unread-fields.constant";
import type { RunwayUnreadField } from "#node/types/runway-unread-field.type";

/** The files a runway reader lives in. */
const READER_SOURCE =
  /^(?:packages\/developer\/(?:runway|cli|gen)\/src|packages\/infrastructure\/[^/]+\/src|tools\/scripts)\/.+\.[cm]?[jt]sx?$/;

/** Reader-source paths that declare or test the fields rather than read them. */
const NOT_A_READER = /\/__tests__\/|-schema\.constant\.ts$|\/types\/|\.d\.ts$/;

/** A comment line, which names a field without reading it. */
const COMMENT = /^\s*(?:\*|\/\/|\/\*)/;

/** The marker a not-yet-read field's description carries. */
const MARKER = /Not read yet \(/;

/** A JSON Schema node. */
type SchemaNode = { readonly [key: string]: unknown };

/** The node a local `$ref` (`#/$defs/resources/properties/cpu`) points at. */
function resolveRef(schema: SchemaNode, ref: string): SchemaNode | undefined {
  let node: unknown = schema;
  for (const part of ref.replace(/^#\//, "").split("/"))
    node = typeof node === "object" && node !== null ? (node as SchemaNode)[part] : undefined;
  return typeof node === "object" && node !== null ? (node as SchemaNode) : undefined;
}

/** Records each path's use-site description, following `$ref`, properties, additional properties, items and unions. */
function collectDescriptions(
  schema: SchemaNode,
  node: SchemaNode,
  path: string,
  out: Map<string, string>,
  seen: Set<string>,
): void {
  if (path !== "" && typeof node["description"] === "string" && !out.has(path))
    out.set(path, node["description"]);
  const walk = (child: unknown, next: string): void => {
    if (typeof child === "object" && child !== null)
      collectDescriptions(schema, child as SchemaNode, next, out, seen);
  };
  const ref = node["$ref"];
  if (typeof ref === "string" && !seen.has(`${ref} ${path}`)) {
    seen.add(`${ref} ${path}`);
    const target = resolveRef(schema, ref);
    if (target) collectDescriptions(schema, target, path, out, seen);
  }
  const join = (key: string): string => (path === "" ? key : `${path}.${key}`);
  const properties = node["properties"];
  if (typeof properties === "object" && properties !== null)
    for (const [key, child] of Object.entries(properties)) walk(child, join(key));
  walk(node["additionalProperties"], join("*"));
  walk(node["items"], join("[]"));
  for (const union of ["oneOf", "anyOf", "allOf"]) {
    const branches = node[union];
    if (Array.isArray(branches)) for (const branch of branches) walk(branch, path);
  }
}

/**
 * The findings of the not-yet-read runway fields.
 *
 * @param read - returns a repository file's text, or undefined when it is absent.
 * @param files - the repository's file paths.
 * @param fields - the listed fields; `RUNWAY_UNREAD_FIELDS` by default.
 * @example
 * checkRunwayUnreadFields((path) => files.get(path), [...files.keys()]); // [] while list, schema and sources agree
 */
export function checkRunwayUnreadFields(
  read: (path: string) => string | undefined,
  files: readonly string[],
  fields: readonly RunwayUnreadField[] = RUNWAY_UNREAD_FIELDS,
): string[] {
  const out: string[] = [];
  for (const kind of ["root", "service", "app"] as const) {
    const file = `tools/schemas/runway-${kind}.schema.json`;
    const text = read(file);
    const listed = fields.filter((field) => field.kind === kind);
    if (text === undefined) {
      if (listed.length)
        out.push(`${file}: missing, but ${listed.length} of its fields are listed as not read yet`);
      continue;
    }
    const schema = JSON.parse(text) as SchemaNode;
    const descriptions = new Map<string, string>();
    collectDescriptions(schema, schema, "", descriptions, new Set());
    for (const field of listed) {
      const description = descriptions.get(field.path);
      if (description === undefined)
        out.push(
          `${file}: \`${field.path}\` is listed as not read yet but has no description in the schema`,
        );
      else if (!description.includes(`Not read yet (${field.reader})`))
        out.push(
          `${file}: \`${field.path}\` is listed as not read yet, but its description lacks "Not read yet (${field.reader})"`,
        );
    }
    for (const [path, description] of descriptions)
      if (MARKER.test(description) && !listed.some((field) => field.path === path))
        out.push(
          `${file}: \`${path}\` says "Not read yet" but is not in RUNWAY_UNREAD_FIELDS: list it, or drop the note if it is read`,
        );
  }
  // Fields that share one access (`health.readiness.*`) are reported together, once per line.
  const byAccess = new Map<string, { readonly access: RegExp; readonly paths: string[] }>();
  for (const field of fields) {
    const group = byAccess.get(field.access.source) ?? { access: field.access, paths: [] };
    group.paths.push(`${field.kind} \`${field.path}\``);
    byAccess.set(field.access.source, group);
  }
  for (const source of files) {
    if (!READER_SOURCE.test(source) || NOT_A_READER.test(source)) continue;
    const lines = (read(source) ?? "").split("\n");
    for (const [index, line] of lines.entries()) {
      if (COMMENT.test(line)) continue;
      for (const { access, paths } of byAccess.values())
        if (access.test(line))
          out.push(
            `${source}:${index + 1}: reads ${paths.join(", ")}, listed as not read yet: remove the read field from RUNWAY_UNREAD_FIELDS and drop "Not read yet" from its schema description`,
          );
    }
  }
  return out;
}
