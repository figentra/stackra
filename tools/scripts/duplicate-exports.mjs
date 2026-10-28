#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: the duplicate-export check of `pnpm validate` (stackra-224, gap analysis cross-redundancy row 23): fails when
 *          one exported value or type name (`export function|const|let|var|class|interface|type|enum|namespace`) is
 *          declared in the `src/` of more than one workspace package, so a helper or type gets one home and the others
 *          import it. A re-export (`export { x } from "@stackra/support"`) declares nothing and never counts.
 * Boundary: reads pnpm-workspace.yaml and the `src/` files (`.ts`, `.tsx`, `.mts`; `__tests__/` and `.d.ts` skipped)
 *           of every member under `packages/`; writes nothing. Two lists exempt a name: `ALLOWED`, the intended
 *           copies (permanent, each with its reason), and `PENDING`, the known duplicates another batch removes
 *           (stackra-225 renames, stackra-223, unfiled gap-analysis rows); a pending entry is deleted when its batch
 *           lands. `PENDING` only shrinks (rule-gap N-6, stackra-229): an entry that no longer matches a duplicate is a
 *           finding, so it is deleted in the change that removed the copy. Run directly it prints the findings and
 *           exits 1, plus a note for `ALLOWED` entries that no longer match a duplicate.
 * Runtime: node
 * Governing contract: ADR 0305 (one declaration per file, one home per concept); gap analysis cross-redundancy rows
 *                     1, 22 and 23; stackra-224 (STA-1382).
 * Scope: every member the `packages` globs of pnpm-workspace.yaml match, under `packages/`.
 * Owner: release-operations · Secrets: forbidden
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { readWorkspaceMembers } from "./package-cycles.mjs";

// oxlint-disable stackra/one-declaration-per-file -- reason: a plain-node script module run by pnpm validate, not member source (like package-cycles.mjs); its tests import these names

/** One exported declaration: the keyword form, then the name (group 1). */
const DECLARATION =
  /^export\s+(?:declare\s+)?(?:default\s+)?(?:abstract\s+)?(?:async\s+)?(?:const\s+enum|function\*?|const|let|var|class|interface|type|enum|namespace)\s+([A-Za-z_$][\w$]*)/gm;

/**
 * Intended copies: the same name in more than one package on purpose. Each value says why; a new entry needs the same.
 */
export const ALLOWED = Object.freeze({
  kebabCase:
    "coding-standard has no workspace dependency by design (oxlint loads it alone) and splits acronym runs for file names; everyone else imports @stackra/support",
  pascalCase:
    "coding-standard has no workspace dependency by design (oxlint loads it alone); everyone else imports @stackra/support",
  KIND_BASES:
    "coding-standard has no workspace dependency by design, so it keeps its own kind table beside gen's",
  LibraryPresetOptions:
    "tooling presets (tsdown, vitest) are tier:config with no workspace dependency (ADR 0300); each preset owns its options",
  libraryPreset:
    "tooling presets (tsdown, vitest) are tier:config with no workspace dependency (ADR 0300); each preset owns its factory",
});

/** The names stackra-225 (STA-1383) renames or gives one home: its issue list plus gap-analysis row 22. */
const BY_225 = [
  "Aggregate",
  "DecideOptions",
  "FormField",
  "Run",
  "Segment",
  "SignatureRequest",
  "decide",
  "providerCodeOf",
  "redact",
  "signal",
];

/** Infrastructure helpers copied between the infra programs (gap-analysis row 14, `@stackra/infra-kit`; no batch yet). */
const INFRA_KIT = [
  "INFRA_RUNWAY_SCHEMA",
  "InfraRunway",
  "MockedResource",
  "PulumiMock",
  "ROOT_SOURCE",
  "ciAccess",
  "costControls",
  "dataKey",
  "egressAddresses",
  "encoreAccess",
  "filesBucket",
  "mockPulumi",
  "outputOf",
  "parseInfraRunway",
  "resolveRef",
];

/** Same name, likely different concept; not reviewed one by one yet (gap-analysis row 22 covers only some). */
const UNREVIEWED = [
  "BINDING_KINDS",
  "CallOptions",
  "CatalogueVersions",
  "CheckOptions",
  "DesktopApp",
  "Extension",
  "FakeAnswer",
  "Field",
  "FieldRule",
  "Form",
  "GeneratedFile",
  "KIND_FOLDERS",
  "Label",
  "LabelFormat",
  "Link",
  "LinkProps",
  "List",
  "LoginDirectoryOptions",
  "MarketContext",
  "Menu",
  "MenuItem",
  "NavigationItem",
  "PathParams",
  "PayInput",
  "Placement",
  "ProviderChoice",
  "PushOptions",
  "QueryOptions",
  "QueryOutput",
  "RenderOptions",
  "RuleDocument",
  "SHAPE_KINDS",
  "SearchHit",
  "Section",
  "SeedResult",
  "TabItem",
  "Table",
  "configKeyOf",
  "entitlementKey",
  "eventName",
  "fieldErrorsOf",
  "issuesOf",
  "messagesOf",
  "modelKey",
  "originOf",
  "permissionKey",
  "registerBlocks",
  "resolveDocument",
  "rollback",
  "rootModuleOf",
  "tableInput",
  "valueAt",
];

/** Known duplicates another batch removes: name to owner. Delete an entry when its batch lands. */
export const PENDING = Object.freeze({
  ...Object.fromEntries(BY_225.map((name) => [name, "stackra-225"])),
  ...Object.fromEntries(
    INFRA_KIT.map((name) => [name, "unfiled: gap-analysis row 14 (infra-kit)"]),
  ),
  DeviceOrder: "unfiled: gap-analysis row 11 (@stackra/sync)",
  OfflineCap: "unfiled: gap-analysis row 11 (@stackra/sync)",
  ReplicaRow: "unfiled: gap-analysis row 11 (@stackra/sync)",
  ColumnRecord: "unfiled: gap-analysis redundancy 21 (database vs panel wire shape)",
  MetricValue: "unfiled: gap-analysis redundancy 21 (database vs panel wire shape)",
  refuse: "unfiled: gap-analysis row 17 (refusal builder through errors)",
  HEALTH_CHECK_SCHEMA: "unfiled: stackra-221 gave each package an internal copy",
  hmacKey: "unfiled: notifications' (secret, use) differs from support's internal (bytes)",
  ...Object.fromEntries(UNREVIEWED.map((name) => [name, "unfiled: unreviewed same-name pair"])),
});

/** Every source file under `dir`, skipping tests, declaration files and build output. */
function sourceFiles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory())
      return ["__tests__", "node_modules", "dist"].includes(entry.name) ? [] : sourceFiles(path);
    return /\.(ts|tsx|mts)$/.test(entry.name) && !entry.name.endsWith(".d.ts") ? [path] : [];
  });
}

/**
 * Each exported name declared in more than one package: name to `[{ name: package, file }]`, one row per package (its
 * first file), sorted by package name; names and rows in a stable order.
 *
 * @example
 * duplicateExports(root).get("escapeHtml"); // [{ name: "@stackra/documents", file: "packages/data/..." }, ...]
 */
export function duplicateExports(root) {
  const homes = new Map();
  for (const { dir, name } of readWorkspaceMembers(root)) {
    if (!dir.startsWith("packages/")) continue;
    for (const path of sourceFiles(join(root, dir, "src")).sort()) {
      for (const [, exported] of readFileSync(path, "utf8").matchAll(DECLARATION)) {
        const rows = homes.get(exported) ?? new Map();
        if (!rows.has(name)) rows.set(name, path.slice(root.length).replace(/^[/\\]/, ""));
        homes.set(exported, rows);
      }
    }
  }
  return new Map(
    [...homes]
      .filter(([, rows]) => rows.size > 1)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([exported, rows]) => [
        exported,
        [...rows].sort(([a], [b]) => (a < b ? -1 : 1)).map(([pkg, file]) => ({ name: pkg, file })),
      ]),
  );
}

/**
 * The validate findings (`{ dir, text }`, as @stackra/repo-checks reports them): one per duplicate that neither list
 * exempts. `allowed` and `pending` default to the lists above; tests pass their own.
 */
export function duplicateExportFindings(root, allowed = ALLOWED, pending = PENDING) {
  const duplicates = duplicateExports(root);
  const copies = [...duplicates]
    .filter(([exported]) => !Object.hasOwn(allowed, exported) && !Object.hasOwn(pending, exported))
    .map(([exported, rows]) => ({
      dir: rows[0].file.split(/[/\\]src[/\\]/)[0],
      text:
        `exported name ${exported} is declared in ${rows.map((row) => `${row.name} (${row.file})`).join(", ")}: ` +
        "give it one home and import it (helpers go to @stackra/support), or add it to ALLOWED in " +
        "tools/scripts/duplicate-exports.mjs with the reason",
    }));
  // PENDING is a ratchet that only shrinks: an entry whose duplicate is gone must leave the list (rule-gap N-6).
  const stale = Object.keys(pending)
    .filter((name) => !duplicates.has(name))
    .sort()
    .map((name) => ({
      dir: "tools/scripts",
      text: `PENDING name ${name} is no longer declared in two packages: delete it from PENDING in duplicate-exports.mjs`,
    }));
  return [...copies, ...stale];
}

/** Allow-list names (either list) that no longer match a duplicate, so the lists can shrink. */
export function staleAllowListEntries(root, allowed = ALLOWED, pending = PENDING) {
  const duplicates = duplicateExports(root);
  return [...Object.keys(allowed), ...Object.keys(pending)]
    .filter((name) => !duplicates.has(name))
    .sort();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = fileURLToPath(new URL("../../", import.meta.url));
  const findings = duplicateExportFindings(root);
  for (const { dir, text } of findings) console.error(`${dir}: ${text}`);
  const stale = staleAllowListEntries(root, ALLOWED, {});
  if (stale.length)
    console.error(`note: no longer duplicated, remove from ALLOWED: ${stale.join(", ")}`);
  if (findings.length) process.exit(1);
}
