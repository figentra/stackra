/**
 * Stackra file contract:
 * Purpose: `agentSourceFindings(context)`, `checkSkillTech` and `checkAgentSources` over the disk: each skill folder's
 *          Markdown under `.agents/skills/` (dot folders such as the vendored `.vendor` left out), each agent file in
 *          `.agents/agents/` (lowercase names only: a README or notes file is no agent), `routing.yaml` and
 *          `models.yaml`. These are the checks core's agents-sync script ran, now that Flow projects `.agents/`
 *          (STA-2098 H6).
 * Boundary: reads files only; a repository with no `.agents/` has no finding.
 * Runtime: node
 * Governing contract: ADR 0227; ADR 0258; STA-2098 (H6).
 */
import { existsSync, lstatSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { checkAgentSources } from "#node/functions/check-agent-sources.function";
import { checkSkillTech } from "#node/functions/check-skill-tech.function";
import type { RawFinding } from "#node/types/raw-finding.type";
import type { RepoContext } from "#node/types/repo-context.type";

/** The Markdown text under `dir`, its sub folders included. */
function markdownUnder(dir: string): string {
  return readdirSync(dir)
    .map((name) => {
      const path = join(dir, name);
      if (lstatSync(path).isDirectory()) return markdownUnder(path);
      return /\.mdx?$/.test(name) ? readFileSync(path, "utf8") : "";
    })
    .join("");
}

/** A file's text under `root`, or undefined when it is missing. */
const readIf = (root: string, rel: string): string | undefined =>
  existsSync(join(root, rel)) ? readFileSync(join(root, rel), "utf8") : undefined;

/**
 * The skill and agent source findings of the repository.
 *
 * @param context - the root.
 * @example
 * agentSourceFindings(readRepoContext(root));
 */
export function agentSourceFindings(context: RepoContext): RawFinding[] {
  const { root } = context;
  const skillsDir = join(root, ".agents/skills");
  const skills = new Map<string, string>();
  if (existsSync(skillsDir))
    for (const name of readdirSync(skillsDir).toSorted())
      if (!name.startsWith(".") && lstatSync(join(skillsDir, name)).isDirectory())
        skills.set(name, markdownUnder(join(skillsDir, name)));
  const agentsDir = join(root, ".agents/agents");
  const agents = existsSync(agentsDir)
    ? readdirSync(agentsDir)
        .filter((name) => /^[a-z][a-z0-9-]*\.md$/.test(name))
        .toSorted()
        .map((name) => ({
          path: `.agents/agents/${name}`,
          text: readFileSync(join(agentsDir, name), "utf8"),
        }))
    : [];
  const routing = readIf(root, ".agents/routing.yaml");
  const models = readIf(root, ".agents/models.yaml");
  return [
    ...checkSkillTech(skills).map((text) => ({ rule: "skill-tech", dir: "", text })),
    ...checkAgentSources({
      agents,
      ...(routing === undefined ? {} : { routing }),
      ...(models === undefined ? {} : { models }),
      exists: (path) => existsSync(join(root, path)),
    }).map((text) => ({ rule: "agent-sources", dir: "", text })),
  ];
}
