/**
 * Stackra file contract:
 * Purpose: `tableDeclarations`, the `t.platformTable(reason)`, `t.reviewedPolicy(reason, policies)`,
 *          `t.systemAccess(options)` and `schema.systemFunction(options)` declarations a compiled migration carries
 *          (`TABLE_DECLARATION_MARKERS`), read back from its SQL text: each platform table with its reason, each
 *          reviewed table with its policies and reason, each system-access table with its select and update columns
 *          and reason, and each system function with its reason.
 * Boundary: pure: SQL text in, maps out. A later declaration of the same table or function replaces an earlier one. A
 *           marker line ends where the compiled statement's `;` was appended, which is not part of the reason.
 * Runtime: isomorphic
 * Governing contract: ADR 0239 (2026-11-07 amendment, group (c) table and gap A); ADR 0347 (decision 5: the catalogue
 *                     audit).
 */
import { TABLE_DECLARATION_MARKERS } from "#core/constants/table-declaration-markers.constant";

const { platformTable, reviewedPolicy, systemAccess, systemFunction } = TABLE_DECLARATION_MARKERS;

/** One marker line: the marker, the schema-qualified table, the rest (the markers hold no regex syntax). */
const LINE = new RegExp(
  `^(${platformTable}|${reviewedPolicy}|${systemAccess}|${systemFunction}) (\\S+) (.+?);?$`,
  "gm",
);

/** The rest of a system-access marker: its select columns, its update columns when any, its reason. */
const GRANTS = /^select=(\S+)(?: update=(\S+))?(?: (.*))?$/;

/** A marker's comma-joined column list, split. */
const list = (columns: string): string[] => (columns === "" ? [] : columns.split(","));

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
  readonly systemAccess: ReadonlyMap<
    string,
    {
      readonly select: readonly string[];
      readonly update: readonly string[];
      readonly reason: string;
    }
  >;
  readonly systemFunctions: ReadonlyMap<string, string>;
} {
  const platform = new Map<string, string>();
  const reviewed = new Map<string, { policies: readonly string[]; reason: string }>();
  const access = new Map<string, { select: string[]; update: string[]; reason: string }>();
  const functions = new Map<string, string>();
  for (const [, marker, table = "", rest = ""] of sql.matchAll(LINE)) {
    if (marker === platformTable) platform.set(table, rest.trim());
    else if (marker === systemFunction) functions.set(table, rest.trim());
    else if (marker === systemAccess) {
      const [, select = "", update = "", reason = ""] = GRANTS.exec(rest.trim()) ?? [];
      access.set(table, { select: list(select), update: list(update), reason: reason.trim() });
    } else {
      const space = rest.indexOf(" ");
      const policies = (space < 0 ? rest : rest.slice(0, space)).split(",");
      reviewed.set(table, { policies, reason: space < 0 ? "" : rest.slice(space + 1).trim() });
    }
  }
  return { platform, reviewed, systemAccess: access, systemFunctions: functions };
}
