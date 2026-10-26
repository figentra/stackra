/**
 * Stackra file contract:
 * Purpose: the doc-standard check (ADR 0007, amended 2026-10-21) run by `pnpm validate`: a thin wrapper over
 *          @stackra/repo-checks (`checkDocFile`, `isDocScoped`, `docsFindings`). `stackra check --only docs` runs the
 *          same check.
 * Boundary: reads tracked files and reports findings; it never edits a file and never judges the wording of a block.
 * Runtime: node
 * Governing contract: ADR 0007 (amendment 2026-10-21), ADR 0128; ADR 0282 (decision 3).
 */
import { fileURLToPath } from "node:url";

import { checks } from "./repo-checks.mjs";

export const { checkDocFile: checkFile, isDocScoped: isInScope } = checks;

const ROOT = fileURLToPath(new URL("../../", import.meta.url));

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const context = checks.readRepoContext(ROOT);
  const scoped = context.files.filter(checks.isDocScoped).length;
  const findings = checks.docsFindings(context);
  for (const { text } of findings) console.error(text);
  if (findings.length) {
    console.error(`\n${findings.length} doc-standard finding(s) in ${scoped} file(s).`);
    process.exit(1);
  }
  console.log(`doc-standard: ${scoped} source file(s) clean.`);
}
