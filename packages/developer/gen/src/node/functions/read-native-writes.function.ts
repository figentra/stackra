/**
 * Stackra file contract:
 * Purpose: `readNativeWrites`, the writes in a member's own source that skip the unit of work: a native or
 *          query-builder insert or update naming a model class, and a raw `insert into`/`update` statement with the
 *          table it names. `checkEncryptedFields` refuses those on a model with `HasEncryptedFields`, since the
 *          `EncryptedFieldsSubscriber` never sees them and the value would be stored in clear.
 * Boundary: a text scan of `src/**` (`__tests__` and `database/` folders skipped: tests may seed raw rows, migrations
 *           write no data), comment lines skipped. It finds the target named on the same line as the call; a write
 *           through a variable holding the class or a SQL string built elsewhere is not seen.
 * Runtime: node
 * Governing contract: ADR 0465 (decision 5: the model encryption path); ADR 0014 (writes go through the unit of work).
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

import type { MemberIR } from "#core/types/member-ir.type";

/** A native or query-builder write naming its model class. */
const NATIVE = /\.(nativeInsert|nativeUpdate|insertMany|insert)\s*\(\s*([A-Z][\w$]*)\s*[,)]/g;

/** A query builder on a model class whose chain inserts or updates on the same line. */
const BUILDER = /\b(createQueryBuilder|qb)\s*\(\s*([A-Z][\w$]*)[^\n]*\.(insert|update)\s*\(/g;

/** A raw statement writing a table: `insert into "crm"."contacts"`, `update crm.contacts`. */
const RAW = /\b(insert\s+into|update)\s+((?:"?[a-z_][a-z0-9_]*"?\.)?"?[a-z_][a-z0-9_]*"?)/gi;

/** The `.ts`/`.tsx` files under `folder` outside tests and database folders, sorted. */
function sourceFiles(folder: string): string[] {
  if (!existsSync(folder)) return [];
  return (
    readdirSync(folder, { withFileTypes: true })
      // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
      .sort((left, right) => (left.name < right.name ? -1 : left.name > right.name ? 1 : 0))
      .flatMap((entry) => {
        if (entry.isDirectory())
          return ["__tests__", "database", "node_modules"].includes(entry.name) ||
            entry.name.startsWith(".")
            ? []
            : sourceFiles(join(folder, entry.name));
        return /\.tsx?$/.test(entry.name) && !entry.name.endsWith(".d.ts")
          ? [join(folder, entry.name)]
          : [];
      })
  );
}

/**
 * The writes past the unit of work in the member at `root`.
 *
 * @param root - the member root.
 * @example
 * readNativeWrites("services/crm")[0]; // { file: "src/modules/crm/services/contact.service.ts", method: "nativeUpdate", target: "Contact", ... }
 */
export function readNativeWrites(root: string): NonNullable<MemberIR["nativeWrites"]> {
  const found: { file: string; line: number; column: number; method: string; target: string }[] =
    [];
  for (const path of sourceFiles(join(root, "src"))) {
    const text = readFileSync(path, "utf8");
    text.split("\n").forEach((line, index) => {
      const trimmed = line.trimStart();
      if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*")) return;
      const at = (match: RegExpMatchArray, method: string, target: string): void => {
        found.push({
          file: relative(root, path),
          line: index + 1,
          column: (match.index ?? 0) + 1,
          method,
          target,
        });
      };
      for (const match of line.matchAll(NATIVE)) at(match, match[1] ?? "", match[2] ?? "");
      for (const match of line.matchAll(BUILDER)) at(match, match[3] ?? "", match[2] ?? "");
      for (const match of line.matchAll(RAW))
        at(match, "sql", (match[2] ?? "").replaceAll('"', "").toLowerCase());
    });
  }
  return found;
}
