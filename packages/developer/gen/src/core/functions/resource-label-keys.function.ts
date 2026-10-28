/**
 * Stackra file contract:
 * Purpose: `resourceLabelKeys(key, tree)`, the label keys the panel's resource pages derive for one recorded resource
 *          tree (`<module>::resources.<model>.<part>[.<path>]`: title, columns, filters, entries, sections, fields and
 *          steps), so the generated web entry can list what the catalogues must hold.
 * Boundary: pure; reads the tree as manifest JSON (`ui.resources`) and skips what it does not recognise. The leaf rule
 *           matches the panel's `resourceLabel` (dots to underscores, camelCase to snake_case). Relations and actions
 *           are not listed: their keys need the related model and the action verb, which the JSON tree does not carry.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 6: derived labels); STA-1378 (stackra-220); STA-1385.
 */

/** The label key of `name` in `part` of resource `key`, as the panel's `resourceLabel` derives it. */
function labelOf(key: string, part: string, name?: string): string {
  const dot = key.indexOf(".");
  const leaf =
    name === undefined
      ? ""
      : `.${name
          .replace(/\./g, "_")
          .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
          .toLowerCase()}`;
  return `${key.slice(0, dot)}::resources.${key.slice(dot + 1)}.${part}${leaf}`;
}

/** `value[field]` as an array of records, or none. */
function listOf(value: unknown, field: string): Record<string, unknown>[] {
  const items =
    typeof value === "object" && value !== null
      ? (value as Record<string, unknown>)[field]
      : undefined;
  return Array.isArray(items)
    ? items.filter(
        (item): item is Record<string, unknown> => typeof item === "object" && item !== null,
      )
    : [];
}

/**
 * The derived label keys of one resource, sorted and unique.
 *
 * @param key - the resource key, `<module>.<model>`.
 * @param tree - its recorded tree from the manifest's `ui.resources`.
 * @example
 * resourceLabelKeys("orders.order", { table: { columns: [{ key: "totalMinor" }], filters: [] } });
 * // ["orders::resources.order.columns.total_minor", "orders::resources.order.title"]
 */
export function resourceLabelKeys(key: string, tree: unknown): string[] {
  const keys = new Set([labelOf(key, "title")]);
  const table =
    typeof tree === "object" && tree !== null
      ? (tree as Record<string, unknown>)["table"]
      : undefined;
  for (const column of listOf(table, "columns"))
    if (typeof column["key"] === "string") keys.add(labelOf(key, "columns", column["key"]));
  for (const filter of listOf(table, "filters"))
    if (typeof filter["key"] === "string") keys.add(labelOf(key, "filters", filter["key"]));
  const entries = (nodes: Record<string, unknown>[]): void => {
    for (const node of nodes) {
      if (node["kind"] === "section" && typeof node["name"] === "string") {
        keys.add(labelOf(key, "sections", node["name"]));
        entries(listOf(node, "entries"));
      } else if (typeof node["key"] === "string") {
        keys.add(labelOf(key, "entries", node["key"]));
        const columns = node["columns"];
        if (node["kind"] === "list" && Array.isArray(columns))
          for (const column of columns)
            if (typeof column === "string")
              keys.add(labelOf(key, "entries", `${node["key"]}.${column}`));
      }
    }
  };
  const fields = (nodes: Record<string, unknown>[]): void => {
    for (const node of nodes) {
      if (typeof node["key"] === "string") keys.add(labelOf(key, "fields", node["key"]));
      fields(listOf(node, "fields"));
      for (const step of listOf(node, "steps")) {
        if (typeof step["name"] === "string") keys.add(labelOf(key, "steps", step["name"]));
        fields(listOf(step, "fields"));
      }
    }
  };
  const record = typeof tree === "object" && tree !== null ? (tree as Record<string, unknown>) : {};
  entries(listOf(record["infolist"], "entries"));
  fields(listOf(record["form"], "fields"));
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
  return [...keys].sort();
}
