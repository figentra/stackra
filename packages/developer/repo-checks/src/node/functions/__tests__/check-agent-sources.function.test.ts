/**
 * Stackra file contract:
 * Purpose: unit tests of `checkAgentSources`: a missing referenced path, a command for an agent without Bash (unless
 *          the line forbids it), an OpenCode `allow`, the retired `sdlc` plugin, and a route to OpenCode for an agent
 *          whose tier OpenCode does not run, each one finding; a clean agent has none.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0121 (D3); ADR 0258; ADR 0293; ADR 0022 (test placement).
 */
import { describe, expect, it } from "@stackra/testing";

import { checkAgentSources } from "#node/functions/check-agent-sources.function";

const MODELS = `tiers: [steward, lead]
assistants:
  claude:
    steward: haiku
    lead: opus
  opencode:
    steward: amazon-bedrock/kimi
`;

const ROUTING = `routes:
  docs:
    executor: opencode
    agent: writer
  design:
    executor: opencode
    agent: architect
`;

/** An agent file with `head` front matter and `body`. */
const agent = (name: string, head: string, body: string) => ({
  path: `.agents/agents/${name}.md`,
  text: `---\nname: ${name}\ndescription: d\n${head}\n---\n\n${body}\n`,
});

describe("checkAgentSources", () => {
  it("names each broken rule once and passes a clean agent", () => {
    const findings = checkAgentSources({
      agents: [
        agent(
          "writer",
          "tier: steward\ntools: [Read, Write]",
          "Read `apps/docs/README.md`. Never `git push`.",
        ),
        agent(
          "architect",
          "tier: lead\ntools: [Read]",
          "Run `pnpm verify` first, then `sdlc:review`.",
        ),
        agent(
          "opener",
          'permissions:\n  - action: edit\n    resource: "*"\n    effect: allow',
          "Edits.",
        ),
      ],
      routing: ROUTING,
      models: MODELS,
      exists: (path) => path === "apps/docs/README.md",
    });
    expect(findings).toEqual([
      ".agents/agents/architect.md: tells the agent to run `pnpm verify` but its tools have no Bash",
      ".agents/agents/architect.md: references the retired sdlc plugin (ADR 0121 D3)",
      ".agents/agents/opener.md: an OpenCode agent's permissions only narrow opencode.jsonc; 'allow' is refused (ADR 0293)",
      ".agents/routing.yaml: task 'design' routes to OpenCode, but agent 'architect' is not projected there (ADR 0258)",
    ]);
  });

  it("names a backticked repository path that does not exist", () => {
    expect(
      checkAgentSources({
        agents: [
          agent(
            "reader",
            "tools: [Read, Bash]",
            "See `packages/gone/src/x.ts` and `packages/<name>/src`.",
          ),
        ],
        exists: () => false,
      }),
    ).toEqual([
      ".agents/agents/reader.md: references `packages/gone/src/x.ts`, which does not exist",
    ]);
  });
});
