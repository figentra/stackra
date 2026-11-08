/**
 * Stackra file contract:
 * Purpose: `rowSecurityDeclarations`, every `t.platformTable(reason)`, `t.reviewedPolicy(reason, policies)`,
 *          `t.systemAccess({ select, update, reason })` and `schema.systemFunction({ name, ..., reason })` call in the
 *          migrations of every workspace member, with its file, table (a function's name), reason, policies and
 *          granted columns, in file order.
 * Boundary: a text scan of each member's `src/**` `*.migration.ts` files (tests, dependencies and build output
 *           skipped). Migrations are frozen literals (ADR 0159), so a call is read as written: the table is the last
 *           `schema.create`/`schema.table` before it, the reason a plain string literal (else undefined), and the
 *           policies the string literals of the array after it. For the two object-taking calls, the reason, the
 *           function's name and the `select`/`update` columns are the first `reason:`, `name:`, `select:` and
 *           `update:` properties after the call.
 * Runtime: node
 * Governing contract: ADR 0239 (2026-11-07 amendment, group (c) table and gap A); ADR 0159 (literal migrations).
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { readManifestMembers } from "#node/functions/read-workspace-members.function";
import { sorted } from "#node/functions/sorted.function";
import type { RowSecurityDeclaration } from "#node/row-security-declarations/types/row-security-declaration.type";

/** A table block: `schema.create("routes"`, `schema.table('routes'`. */
const TABLE = /\bschema\.(?:create|table)\(\s*["'`]([A-Za-z_]\w*)["'`]/g;

/** A declaration call, up to its first argument. */
const CALL = /\.(platformTable|reviewedPolicy|systemAccess|systemFunction)\(\s*/g;

/** The start of the next schema call or declaration call. */
const NEXT_CALL =
  /\bschema\.\w+\(|\.(?:platformTable|reviewedPolicy|systemAccess|systemFunction)\(/;

/** A plain string literal at the start of the text: double, single or a backtick without a placeholder. */
const LITERAL = /^(?:"((?:[^"\\\n]|\\.)*)"|'((?:[^'\\\n]|\\.)*)'|`([^`$\\]*)`)/;

/** Every `*.migration.ts` file under `dir`, skipping tests, dependencies and build output. */
function migrationFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory())
      return ["node_modules", "dist", "__tests__", ".stackra"].includes(entry.name)
        ? []
        : migrationFiles(path);
    return entry.name.endsWith(".migration.ts") ? [path] : [];
  });
}

/** The value of the string literal at the start of `text`, or undefined when there is none. */
function literal(text: string): { readonly value: string; readonly length: number } | undefined {
  const match = LITERAL.exec(text);
  if (match === null) return undefined;
  return { value: match[1] ?? match[2] ?? match[3] ?? "", length: match[0].length };
}

/** The string literals of the array of the first `key:` property in `text`. */
function listOf(text: string, key: string): string[] {
  const list = new RegExp(`\\b${key}\\s*:\\s*\\[([^\\]]*)\\]`).exec(text)?.[1] ?? "";
  return [...list.matchAll(/["'`]([^"'`]+)["'`]/g)].map((item) => item[1] ?? "");
}

/** The string literal of the first `key:` property in `text`, or undefined when it is not a plain literal. */
function propertyOf(text: string, key: string): string | undefined {
  const at = new RegExp(`\\b${key}\\s*:\\s*`).exec(text);
  return at === null ? undefined : literal(text.slice(at.index + at[0].length))?.value;
}

/**
 * The declarations in the migrations of the workspace at `root`.
 *
 * @example
 * rowSecurityDeclarations(root)[0];
 * // { file: "services/checkout/src/.../0004-declare-routes.migration.ts", table: "checkout_session_routes",
 * //   kind: "reviewedPolicy", reason: "…", policies: ["pol_checkout_session_routes_read"] }
 */
export function rowSecurityDeclarations(root: string): RowSecurityDeclaration[] {
  const found: RowSecurityDeclaration[] = [];
  for (const { dir } of readManifestMembers(root))
    for (const path of sorted(migrationFiles(join(root, dir, "src")))) {
      const text = readFileSync(path, "utf8");
      const file = path.slice(root.length + 1);
      const tables = [...text.matchAll(TABLE)];
      for (const call of text.matchAll(CALL)) {
        const at = (call.index ?? 0) + call[0].length;
        let table = "";
        for (const block of tables) if ((block.index ?? 0) < at) table = block[1] ?? "";
        const kind = call[1] as RowSecurityDeclaration["kind"];
        if (kind === "systemAccess" || kind === "systemFunction") {
          // The call's own text: up to the next schema call or declaration, so a property is never a later call's.
          const after = text.slice(at);
          const next = after.search(NEXT_CALL);
          const rest = next < 0 ? after : after.slice(0, next);
          found.push({
            file,
            table: kind === "systemFunction" ? (propertyOf(rest, "name") ?? "") : table,
            kind,
            reason: propertyOf(rest, "reason"),
            policies: [],
            columns:
              kind === "systemAccess"
                ? [
                    ...listOf(rest, "select").map((column) => `select ${column}`),
                    ...listOf(rest, "update").map((column) => `update ${column}`),
                  ]
                : [],
          });
          continue;
        }
        const reason = literal(text.slice(at));
        let policies: string[] = [];
        if (kind === "reviewedPolicy" && reason !== undefined) {
          const list = /^\s*,\s*\[([^\]]*)\]/.exec(text.slice(at + reason.length))?.[1] ?? "";
          policies = [...list.matchAll(/["'`]([^"'`]+)["'`]/g)].map((policy) => policy[1] ?? "");
        }
        found.push({ file, table, kind, reason: reason?.value, policies, columns: [] });
      }
    }
  return found;
}
