/**
 * Stackra file contract:
 * Purpose: the assistant events a hook document can run on, named once for every assistant; each renderer maps a
 *          code to its tool's own event name (`PreToolUse` in Claude Code, and so on).
 * Boundary: an `Enum.of` value plus the type of the same name.
 * Runtime: isomorphic
 * Governing contract: ADR 0282 (decisions 2 and 9: guard hooks install at the user level), ADR 0231 (snake_case
 *                     codes).
 */
import { Enum } from "@stackra/contracts";

/** One case per event a hook runs on. */
export const HookEvent = Enum.of({
  /** A session starts or resumes. */
  SessionStart: "session_start",
  /** The user submits a prompt, before the model sees it. */
  PromptSubmit: "prompt_submit",
  /** Before a tool call runs; a non-zero exit refuses the call. */
  PreToolUse: "pre_tool_use",
  /** After a tool call has run. */
  PostToolUse: "post_tool_use",
});

/** One of the codes above. */
export type HookEvent = Enum.Value<typeof HookEvent>;
