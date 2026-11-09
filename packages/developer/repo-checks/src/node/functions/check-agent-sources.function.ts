/**
 * Stackra file contract:
 * Purpose: `checkAgentSources(input)`: the house rules for `.agents/agents/*.md` that projecting them does not check
 *          (STA-2098 H6, moved from core's agents-sync script): a backticked repository path in an agent's body must
 *          exist; an agent whose tools have no Bash is never told to run a command; an OpenCode agent's permissions
 *          only narrow `opencode.jsonc`, so `allow` is refused (ADR 0293); no agent or route names the retired `sdlc`
 *          plugin (ADR 0121 D3); and a route that hands a task to OpenCode names an agent whose tier OpenCode runs
 *          (ADR 0258).
 * Boundary: pure: the agent files' paths and texts, `routing.yaml`'s and `models.yaml`'s texts, and an existence
 *           predicate; `agentSourceFindings` reads the disk.
 * Runtime: node
 * Governing contract: ADR 0121 (D3); ADR 0258; ADR 0293.
 */
import { parse as parseYaml } from "yaml";

import type { AgentSourceInput } from "#node/types/agent-source-input.type";

/** A path an agent body names that this repository holds. */
const REFERENCE =
  /^(\.agents|\.claude|\.opencode|apps|packages|services|workers|tools)\/|^(AGENTS|CLAUDE|README)\.md$|^(turbo\.jsonc|pnpm-workspace\.yaml|\.oxlintrc\.jsonc|mise\.toml|lefthook\.yml|opencode\.jsonc)$/;

/** A command an agent body tells it to run. */
const COMMAND = /`((?:pnpm|npx|node|turbo|git|gh|glab|encore|lychee|markdownlint-cli2)\s[^`]*)`/g;

/** A line that forbids what it names ("never `git push`") is not an instruction to run it. */
const FORBIDS = /\b(never|not|don't|do not|must not|no)\b/i;

/** An agent's front matter value of `key` (a scalar, or a flow list joined by commas). */
function field(text: string, key: string): string | undefined {
  const head = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)?.[1] ?? "";
  return new RegExp(`^${key}:\\s*(.+)$`, "m")
    .exec(head)?.[1]
    ?.trim()
    .replaceAll(/^\[|\]$/g, "");
}

/**
 * The house-rule findings of the agent sources.
 *
 * @param input - the agents, `routing.yaml`, `models.yaml` and an existence predicate.
 * @example
 * checkAgentSources({ agents: [{ path: ".agents/agents/a.md", text }], exists: existsSync });
 */
export function checkAgentSources(input: AgentSourceInput): string[] {
  const findings: string[] = [];
  const tiers = new Map<string, string | undefined>();
  for (const { path, text } of input.agents) {
    const body = text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");
    const refs = [...body.matchAll(/`([^`\s]+)`/g)]
      .map((m) => (m[1] ?? "").replace(/[:#].*$/, "").replace(/[.,;)]+$/, ""))
      .filter((r) => REFERENCE.test(r) && !/[<>*{}]|NNNN|XX/.test(r));
    for (const ref of new Set(refs))
      if (!input.exists(ref)) findings.push(`${path}: references \`${ref}\`, which does not exist`);
    const tools = field(text, "tools");
    if (tools !== undefined && !tools.split(",").some((t) => t.trim() === "Bash")) {
      const commands = new Set<string>();
      for (const line of body.split("\n"))
        if (!FORBIDS.test(line)) for (const m of line.matchAll(COMMAND)) commands.add(m[1] ?? "");
      for (const c of commands)
        findings.push(`${path}: tells the agent to run \`${c}\` but its tools have no Bash`);
    }
    if (/^\s+effect:\s*allow\s*$/m.test(text))
      findings.push(
        `${path}: an OpenCode agent's permissions only narrow opencode.jsonc; 'allow' is refused (ADR 0293)`,
      );
    if (/\bsdlc:/.test(text))
      findings.push(`${path}: references the retired sdlc plugin (ADR 0121 D3)`);
    tiers.set(path.replaceAll(/^.*\/|\.md$/g, ""), field(text, "tier"));
  }
  if (input.routing !== undefined && /\bsdlc:/.test(input.routing))
    findings.push(".agents/routing.yaml: references the retired sdlc plugin (ADR 0121 D3)");
  const opencode =
    input.models === undefined
      ? undefined
      : (parseYaml(input.models)?.assistants?.opencode ?? undefined);
  if (input.routing !== undefined && opencode !== undefined)
    for (const m of input.routing.matchAll(/^ {2}([\w-]+):[ \t]*\n((?: {4}\S.*\n?)+)/gm)) {
      const executor = /executor:\s*([\w-]+)/.exec(m[2] ?? "")?.[1];
      const agent = /agent:\s*([\w-]+)/.exec(m[2] ?? "")?.[1];
      if (executor !== "opencode" || agent === undefined || !tiers.has(agent)) continue;
      const tier = tiers.get(agent);
      if (tier !== undefined && !(tier in opencode))
        findings.push(
          `.agents/routing.yaml: task '${m[1]}' routes to OpenCode, but agent '${agent}' is not projected there (ADR 0258)`,
        );
    }
  return findings;
}
