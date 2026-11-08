/**
 * Stackra file contract:
 * Purpose: `rowSecurityDeclarationFindings`, the review check of `t.platformTable` and `t.reviewedPolicy`: a
 *          declaration whose reason is not a non-empty string literal, one missing from the review list
 *          (`DECLARATIONS_LEDGER_FILE`) or listed with another reason, and a listed declaration no migration makes any
 *          more. A new or changed declaration therefore shows in the review list's diff, where it is reviewed.
 * Boundary: reads the migrations (`rowSecurityDeclarations`) and the review list; writes nothing. The list keys a
 *           declaration by `<file>#<table>` under its kind.
 * Runtime: node
 * Governing contract: ADR 0239 (2026-11-07 amendment, group (c) table); ADR 0347 (decision 5).
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { parse } from "yaml";

import type { DirFinding } from "#node/types/dir-finding.type";
import { DECLARATIONS_LEDGER_FILE } from "#node/row-security-declarations/constants/declarations-ledger-file.constant";
import { rowSecurityDeclarations } from "#node/row-security-declarations/functions/row-security-declarations.function";
import type { RowSecurityDeclaration } from "#node/row-security-declarations/types/row-security-declaration.type";

/** The review list: per kind, `<file>#<table>` to the reviewed reason. */
type Ledger = Partial<Record<RowSecurityDeclaration["kind"], Record<string, string>>>;

/**
 * The findings of the declarations of the workspace at `root`.
 *
 * @example
 * rowSecurityDeclarationFindings(root); // [] when every declaration is listed with its reason
 */
export function rowSecurityDeclarationFindings(
  root: string,
  declarations: readonly RowSecurityDeclaration[] = rowSecurityDeclarations(root),
): DirFinding[] {
  const path = join(root, DECLARATIONS_LEDGER_FILE);
  const ledger = (existsSync(path) ? (parse(readFileSync(path, "utf8")) ?? {}) : {}) as Ledger;
  const findings: DirFinding[] = [];
  const seen = new Set<string>();
  for (const declaration of declarations) {
    const key = `${declaration.file}#${declaration.table}`;
    seen.add(`${declaration.kind} ${key}`);
    const reason = declaration.reason?.trim() ?? "";
    if (reason === "") {
      findings.push({
        dir: declaration.file,
        text: `t.${declaration.kind} on ${declaration.table} needs its reason as a non-empty string literal`,
      });
      continue;
    }
    const listed = ledger[declaration.kind]?.[key];
    if (listed === undefined)
      findings.push({
        dir: declaration.file,
        text: `t.${declaration.kind} on ${declaration.table} is not in ${DECLARATIONS_LEDGER_FILE}: add "${key}: ${reason}" under ${declaration.kind} for review`,
      });
    else if (listed.trim() !== reason)
      findings.push({
        dir: declaration.file,
        text: `t.${declaration.kind} on ${declaration.table} gives a reason other than the reviewed one in ${DECLARATIONS_LEDGER_FILE}`,
      });
  }
  for (const kind of ["platformTable", "reviewedPolicy"] as const)
    for (const key of Object.keys(ledger[kind] ?? {}))
      if (!seen.has(`${kind} ${key}`))
        findings.push({
          dir: DECLARATIONS_LEDGER_FILE,
          text: `${kind} ${key} is listed but no migration declares it any more: remove it`,
        });
  return findings;
}
