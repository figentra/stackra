/**
 * Stackra file contract:
 * Purpose: hold `stackra row-security-declarations` to its contract: `rowSecurityDeclarations` finds every
 *          `t.platformTable` and `t.reviewedPolicy` call in a member's migrations with its table, reason and policies
 *          (skipping tests and build output), and `rowSecurityDeclarationFindings` fails a declaration without a
 *          string-literal reason, one missing from the review list or listed with another reason, and a listed one no
 *          migration makes; a fully reviewed workspace has no finding, and the committed review list parses.
 * Boundary: writes fixture workspaces into temp directories; reads only the committed review list of this checkout.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (tests live in tests folders); ADR 0239 (2026-11-07 amendment, group (c) table).
 */
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "@stackra/testing";
import { parse } from "yaml";

import { DECLARATIONS_LEDGER_FILE } from "#node/row-security-declarations/constants/declarations-ledger-file.constant";
import { rowSecurityDeclarationFindings } from "#node/row-security-declarations/functions/row-security-declaration-findings.function";
import { rowSecurityDeclarations } from "#node/row-security-declarations/functions/row-security-declarations.function";

const MIGRATION =
  "packages/runtime/relay/src/node/database/migrations/0003-declare-tables.migration.ts";

const SOURCE = `import { type Blueprint, Migration, type SchemaBuilder } from "@stackra/database";

export class DeclareTablesMigration extends Migration {
  up(schema: SchemaBuilder): void {
    schema.table("cursors", (t: Blueprint) => t.platformTable("one row per consumer class"));
    schema.table("routes", (t: Blueprint) => {
      t.reviewedPolicy('a pre-tenant route read', ["pol_routes_read", "pol_routes_write"]);
    });
    schema.table("drafts", (t: Blueprint) => t.platformTable(REASON));
  }
}
`;

/** A temp workspace with one package member and `files` (repository path to text). */
function workspace(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), "row-security-declarations-"));
  writeFileSync(join(root, "pnpm-workspace.yaml"), "packages:\n  - packages/*/*\n");
  mkdirSync(join(root, "packages/runtime/relay"), { recursive: true });
  writeFileSync(
    join(root, "packages/runtime/relay/package.json"),
    JSON.stringify({ name: "@stackra/relay" }),
  );
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  }
  return root;
}

describe("rowSecurityDeclarations", () => {
  it("finds each declaration with its table, reason and policies, skipping tests and build output", () => {
    const root = workspace({
      [MIGRATION]: SOURCE,
      "packages/runtime/relay/src/node/database/migrations/__tests__/x.migration.ts": SOURCE,
      "packages/runtime/relay/dist/x.migration.ts": SOURCE,
    });
    expect(rowSecurityDeclarations(root)).toEqual([
      {
        file: MIGRATION,
        table: "cursors",
        kind: "platformTable",
        reason: "one row per consumer class",
        policies: [],
      },
      {
        file: MIGRATION,
        table: "routes",
        kind: "reviewedPolicy",
        reason: "a pre-tenant route read",
        policies: ["pol_routes_read", "pol_routes_write"],
      },
      { file: MIGRATION, table: "drafts", kind: "platformTable", reason: undefined, policies: [] },
    ]);
  });
});

describe("rowSecurityDeclarationFindings", () => {
  it("fails an unreviewed, changed, reasonless or stale declaration", () => {
    const root = workspace({
      [MIGRATION]: SOURCE,
      [DECLARATIONS_LEDGER_FILE]: [
        "platformTable:",
        `  ${MIGRATION}#cursors: an older reason`,
        `  ${MIGRATION}#gone: a table no migration declares`,
        "reviewedPolicy: {}",
        "",
      ].join("\n"),
    });
    const texts = rowSecurityDeclarationFindings(root).map((finding) => finding.text);
    expect(texts).toEqual([
      `t.platformTable on cursors gives a reason other than the reviewed one in ${DECLARATIONS_LEDGER_FILE}`,
      `t.reviewedPolicy on routes is not in ${DECLARATIONS_LEDGER_FILE}: add "${MIGRATION}#routes: a pre-tenant route read" under reviewedPolicy for review`,
      "t.platformTable on drafts needs its reason as a non-empty string literal",
      `platformTable ${MIGRATION}#gone is listed but no migration declares it any more: remove it`,
    ]);
  });

  it("passes when every declaration is listed with its reason", () => {
    const root = workspace({
      [MIGRATION]: SOURCE.replace("t.platformTable(REASON)", 't.platformTable("drafts only")'),
      [DECLARATIONS_LEDGER_FILE]: [
        "platformTable:",
        `  ${MIGRATION}#cursors: one row per consumer class`,
        `  ${MIGRATION}#drafts: drafts only`,
        "reviewedPolicy:",
        `  ${MIGRATION}#routes: a pre-tenant route read`,
        "",
      ].join("\n"),
    });
    expect(rowSecurityDeclarationFindings(root)).toEqual([]);
  });

  it("keeps the committed review list parseable, one map per kind", () => {
    const committed = fileURLToPath(
      new URL(`../../../../../../../../${DECLARATIONS_LEDGER_FILE}`, import.meta.url),
    );
    const ledger = parse(readFileSync(committed, "utf8")) as Record<string, unknown>;
    expect(Object.keys(ledger).sort()).toEqual(["platformTable", "reviewedPolicy"]);
  });
});
