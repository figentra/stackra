/**
 * Stackra file contract:
 * Purpose: `OPENCODE_ACTIONS`, each neutral tool name mapped to the OpenCode permission action it needs. OpenCode has no
 *          tool grant, so every action here that a sub-agent's tools do not reach is denied for it.
 * Boundary: internal; read-only tools are absent because OpenCode allows reading by default.
 * Runtime: isomorphic
 * Governing contract: ADR 0286 (decisions 6 and 16: ported from the Vellum renderer layer, OpenCode tested).
 */

/** Neutral tool name to OpenCode permission action. */
export const OPENCODE_ACTIONS: Readonly<Record<string, string>> = Object.freeze({
  Write: "edit",
  Edit: "edit",
  MultiEdit: "edit",
  NotebookEdit: "edit",
  Bash: "shell",
  WebFetch: "webfetch",
  WebSearch: "websearch",
  Task: "subagent",
  Agent: "subagent",
});
