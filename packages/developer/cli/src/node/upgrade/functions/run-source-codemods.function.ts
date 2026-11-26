/**
 * Stackra file contract:
 * Purpose: `runSourceCodemods(engines, file, text, codemods)`, every planned codemod over one source file, in order:
 *          ast-grep parses the file and finds the modules it imports from; a codemod whose modules it names reports
 *          its rule's matches (ast-grep) and rewrites its renames (ts-morph). A file that names none of the codemods'
 *          modules is answered unchanged without being parsed.
 * Boundary: pure over the text: it reads and writes no file. ts-morph works in an in-memory project the caller
 *           creates once per run (`createCodemodProject`); the file is removed from it before this returns.
 * Runtime: node
 * Governing contract: ADR 0199 (decision 2: ast-grep and ts-morph); STA-145.
 */
import { extname } from "node:path";

import type { Project } from "ts-morph";

import { renameExports } from "#node/upgrade/functions/rename-exports.function";
import { reportCodemodFindings } from "#node/upgrade/functions/report-codemod-findings.function";
import { sourceModules } from "#node/upgrade/functions/source-modules.function";
import type { CodemodEngines } from "#node/upgrade/types/codemod-engines.type";
import type { SourceCodemodResult } from "#node/upgrade/types/source-codemod-result.type";
import type { UpgradeCodemod } from "#node/upgrade/types/upgrade-codemod.type";
import type { UpgradeFinding } from "#node/upgrade/types/upgrade-finding.type";

let pathId = 0;

/** A number no earlier edit of this process used. */
function nextPathId(): number {
  pathId += 1;
  return pathId;
}

/** The modules a codemod reads a file for. */
function modulesOf(codemod: UpgradeCodemod): readonly string[] {
  return [
    ...(codemod.renames ?? []).flatMap((rename) => rename.from),
    ...(codemod.report?.modules ?? []),
  ];
}

/** True when `source` names one of the codemod's modules (a plain text search, before any parse). */
function names(codemod: UpgradeCodemod, source: string): boolean {
  return modulesOf(codemod).some((module) => source.includes(module));
}

/**
 * Run the codemods over one file.
 *
 * @param file - the file, relative to the workspace root; its extension picks the grammar (TypeScript or TSX).
 * @example
 * runSourceCodemods(engines, project, "src/a.ts", text, [IDENTITY_ACCOUNT_SESSION_CODEMOD]).changedBy;
 * // ["identity-account-session"]
 */
export function runSourceCodemods(
  engines: CodemodEngines,
  project: Project,
  file: string,
  text: string,
  codemods: readonly UpgradeCodemod[],
): SourceCodemodResult {
  // A codemod acts only on a file that names one of its modules, and a rename only brings in the module it moves to,
  // so a file that names none of the modules is answered unchanged without being parsed.
  if (!codemods.some((codemod) => names(codemod, text)))
    return { text, changedBy: [], findings: [] };
  const { astGrep, tsMorph } = engines;
  const extension = extname(file);
  // TypeScript's grammar keeps `<T>value` assertions; JSX and plain JavaScript (which has neither) parse as TSX.
  const lang = /^\.[mc]?ts$/.test(extension) ? astGrep.Lang.TypeScript : astGrep.Lang.Tsx;
  let current = text;
  let root = astGrep.parse(lang, current).root();
  const changedBy: string[] = [];
  const findings: UpgradeFinding[] = [];
  for (const codemod of codemods) {
    // A rename earlier in the run may have brought in a module a later codemod reads, so check the current text.
    if (!names(codemod, current)) continue;
    const modules = sourceModules(root);
    if (!modulesOf(codemod).some((module) => modules.has(module))) continue;
    if (codemod.report !== undefined) findings.push(...reportCodemodFindings(root, codemod, file));
    if (codemod.renames === undefined) continue;
    // A fresh path for every edit: the language service caches a file's snapshot by path and version, and a file
    // made again at a path it has seen can start from the same version, so a rename would read the old text.
    const source = project.createSourceFile(`/upgrade/${nextPathId()}/source${extension}`, current);
    const quote = /^\s*(?:import|export)\b[^'"\n]*'/m.test(current)
      ? tsMorph.QuoteKind.Single
      : tsMorph.QuoteKind.Double;
    project.manipulationSettings.set({ quoteKind: quote });
    const notes = renameExports(source, codemod.renames, tsMorph);
    findings.push(...notes.map((note) => ({ codemod: codemod.id, file, ...note })));
    const next = source.getFullText();
    project.removeSourceFile(source);
    if (next !== current) {
      current = next;
      changedBy.push(codemod.id);
      root = astGrep.parse(lang, current).root();
    }
  }
  return { text: current, changedBy, findings };
}
