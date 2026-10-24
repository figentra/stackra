/**
 * Stackra file contract:
 * Purpose: `KIRO_TOOLS`, each neutral tool name (the Claude Code names a sub-agent document lists) mapped to its Kiro
 *          tool, or `null` where Kiro has none and the tool is dropped on purpose.
 * Boundary: internal; a tool absent from the map makes the Kiro render throw, so a new tool forces a decision here
 *           instead of vanishing from Kiro.
 * Runtime: isomorphic
 * Governing contract: ADR 0286 (decisions 6 and 16: ported from the Vellum renderer layer, Kiro untested).
 */

/** Neutral tool name to Kiro tool name. */
export const KIRO_TOOLS: Readonly<Record<string, string | null>> = Object.freeze({
  Read: "read",
  Grep: "read",
  Glob: "read",
  LS: "read",
  Write: "write",
  Edit: "write",
  MultiEdit: "write",
  NotebookEdit: "write",
  Bash: "shell",
  WebFetch: "web",
  WebSearch: "web",
  TodoWrite: "todo_list",
  Task: "subagent",
  Agent: "subagent",
  // Kiro loads skills as resources, not through a tool.
  Skill: null,
});
