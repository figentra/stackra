/**
 * Stackra file contract:
 * Purpose: `checkRepositoryLayout(input)`, the `layout` rule: a repository's root holds only its template's entries,
 *          its member folders, `tools/` with a README and the entries it declares with a reason; never a root `src/`
 *          or another script folder; `apps/` only when declared; and no path uses the retired name `figentra-flow` or a
 *          name the repository bans in package.json `stackra.layout.banned`.
 * Boundary: pure; `layoutFindings` reads the repository.
 * Runtime: node
 * Governing contract: ADR 0526 (decisions 1 to 5); ADR 0528 (decision 2); ADR 0529 (decision 5).
 */
import { LAYOUT_TEMPLATES } from "#node/constants/layout-templates.constant";
import type { LayoutInput } from "#node/types/layout-input.type";

/** Entries every template requires (ADR 0526 d2, ADR 0528). */
const REQUIRED = ["AGENTS.md", "README.md", "docs", "flow.config.json"];

/** Script folders a declaration cannot allow: scripts go into a CLI or under `tools/` (ADR 0526 d5). */
const SCRIPT_FOLDERS = new Set(["scripts", "bin"]);

/** The retired Flow name in any case and separator (ADR 0529 d5). */
const RETIRED_FLOW_NAME = /figentra[-_]flow/i;

/** ADR registers keep their historic slugs. */
const HISTORY = /(^|\/)adr\//;

/**
 * The layout findings of one repository.
 *
 * @param input - the repository's entries, paths, preset, members and declarations.
 * @example
 * checkRepositoryLayout({ entries: ["src"], paths: [], preset: "neutral", members: [], allow: {}, toolsReadme: false });
 */
export function checkRepositoryLayout(input: LayoutInput): string[] {
  const template = LAYOUT_TEMPLATES[input.preset];
  if (!template) return [`flow.config.json: preset "${input.preset}" has no template (ADR 0528)`];
  const out: string[] = [];
  for (const name of REQUIRED)
    if (!input.entries.includes(name))
      out.push(`${name}: missing; the ${input.preset} template has it (ADR 0526)`);
  for (const name of input.entries) {
    if (name === "src") out.push("src/: no root src/; code lives in members (ADR 0526 d1)");
    else if (SCRIPT_FOLDERS.has(name))
      out.push(`${name}/: scripts go into a CLI or under tools/ (ADR 0526 d5)`);
    else if (name === "tools") {
      if (!input.toolsReadme)
        out.push("tools/: add a README.md saying why each entry is here (ADR 0526 d5)");
    } else if (template.includes(name) || Object.hasOwn(input.allow, name)) continue;
    else if (name === "apps")
      out.push(
        "apps/: only where an app is the product; declare it in package.json stackra.layout.allow with the reason (ADR 0526 d3)",
      );
    else if (!input.members.includes(name))
      out.push(
        `${name}: not in the ${input.preset} template; remove it or declare it in package.json stackra.layout.allow with the reason (ADR 0526 d4)`,
      );
  }
  const banned = input.banned.map((name) => name.toLowerCase());
  for (const path of input.paths) {
    if (HISTORY.test(path)) continue;
    if (RETIRED_FLOW_NAME.test(path))
      out.push(`${path}: the name figentra-flow is retired; use flow or fflow (ADR 0529 d5)`);
    const hit = banned.find((name) => path.toLowerCase().includes(name));
    if (hit !== undefined)
      out.push(`${path}: the name ${hit} is banned here (package.json stackra.layout.banned)`);
  }
  return out;
}
