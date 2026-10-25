/**
 * Stackra file contract:
 * Purpose: the assistants the renderers write for: Claude Code, OpenCode, Kiro, Cursor, and `AGENTS.md`, the one file
 *          Codex, Gemini and the other assistants read.
 * Boundary: an `Enum.of` value plus the type of the same name. Where each assistant's root sits (project or user level)
 *           is the caller's (`stackra agents`, Vellum), not this package's.
 * Runtime: isomorphic
 * Governing contract: ADR 0282 (decisions 2 and 10); ADR 0286 (decisions 6 and 16); ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/** One case per assistant layout. */
export const Assistant = Enum.of({
  /** Claude Code: `skills/`, `agents/`, `commands/`, `rules/` and `hooks/hooks.json` under `.claude/` or a plugin. */
  ClaudeCode: "claude_code",
  /** OpenCode: `skills/`, `agents/` and `commands/` under `.opencode/` or `~/.config/opencode/`. */
  OpenCode: "opencode",
  /** Kiro: `skills/`, `steering/` and `agents/` under `.kiro/`. Untested (ADR 0286 decision 16). */
  Kiro: "kiro",
  /** Cursor: `rules/*.mdc` and `commands/` under `.cursor/`. Untested (ADR 0286 decision 16). */
  Cursor: "cursor",
  /** One `AGENTS.md` for Codex, Gemini and every assistant that reads it. */
  AgentsMd: "agents_md",
});

/** One of the codes above. */
export type Assistant = Enum.Value<typeof Assistant>;
