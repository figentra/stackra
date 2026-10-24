/**
 * Stackra file contract:
 * Purpose: `CLAUDE_HOOK_EVENTS`, each neutral hook event mapped to its Claude Code event name, in the order the events
 *          are written into `hooks/hooks.json`.
 * Boundary: internal; typed against `HookEvent`, so a new event fails to compile until it is mapped.
 * Runtime: isomorphic
 * Governing contract: ADR 0282 (decision 9: guard hooks install at the user level through the plugin).
 */
import type { HookEvent } from "@stackra/skills";

/** Neutral hook event to Claude Code event name. */
export const CLAUDE_HOOK_EVENTS: Readonly<Record<HookEvent, string>> = Object.freeze({
  session_start: "SessionStart",
  prompt_submit: "UserPromptSubmit",
  pre_tool_use: "PreToolUse",
  post_tool_use: "PostToolUse",
});
