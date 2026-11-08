/**
 * Stackra file contract:
 * Purpose: `tableDeclarations`, the `t.platformTable(reason)` and `t.reviewedPolicy(reason, policies)` declarations a
 *          compiled migration carries (`TABLE_DECLARATION_MARKERS`), read back from its SQL text: each platform table
 *          with its reason, each reviewed table with its policies and reason.
 * Boundary: pure: SQL text in, maps out. A later declaration of the same table replaces an earlier one. A marker line
 *           ends where the compiled statement's `;` was appended, which is not part of the reason.
 * Runtime: isomorphic
 * Governing contract: ADR 0239 (2026-11-07 amendment, group (c) table); ADR 0347 (decision 5: the catalogue audit).
 */
import { TABLE_DECLARATION_MARKERS } from "#core/constants/table-declaration-markers.constant";

const { platformTable, reviewedPolicy } = TABLE_DECLARATION_MARKERS;

/** One marker line: the marker, the schema-qualified table, the rest (the markers hold no regex syntax). */
const LINE = new RegExp(`^(${platformTable}|${reviewedPolicy}) (\\S+) (.+?);?$`, "gm");

/**
 * The declarations of `sql`, one or more compiled migration files.
 *
 * @example
 * tableDeclarations("-- stackra:platform-table outbox.inbox event ids only;\n").platform.get("outbox.inbox");
 * // "event ids only"
 */
export function tableDeclarations(sql: string): {
  readonly platform: ReadonlyMap<string, string>;
  readonly reviewed: ReadonlyMap<
    string,
    { readonly policies: readonly string[]; readonly reason: string }
  >;
} {
  const platform = new Map<string, string>();
  const reviewed = new Map<string, { policies: readonly string[]; reason: string }>();
  for (const [, marker, table = "", rest = ""] of sql.matchAll(LINE)) {
    if (marker === platformTable) platform.set(table, rest.trim());
    else {
      const space = rest.indexOf(" ");
      const policies = (space < 0 ? rest : rest.slice(0, space)).split(",");
      reviewed.set(table, { policies, reason: space < 0 ? "" : rest.slice(space + 1).trim() });
    }
  }
  return { platform, reviewed };
}
