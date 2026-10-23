#!/usr/bin/env node
/**
 * PreToolUse (Bash): the permission tiers of ADR 0293 for a shell command. The rules live in `_rules.mjs`, shared
 * with the OpenCode guard; this hook only reads the payload (`cwd`, `agent_type`, `agent_id`, `session_id`) and
 * reports the decision: deny, ask (a human confirms), or nothing (allow). From a subagent (`agent_id` set; the main
 * thread never has one, `--agent` sessions included) `_rules.mjs` turns an ask into a deny, except the `HUMAN_ASKS`
 * (STA-351). Accident guard, not a boundary: it fails open on its own errors.
 */
import { readStdin, deny, ask, failOpen } from "./_io.mjs";
import { decideBash, sessionScratchpad } from "./_rules.mjs";

const EVENT = "PreToolUse";

async function main() {
  const input = await readStdin();
  const raw = String(input.tool_input?.command ?? "");
  const cwd = String(input.cwd || process.cwd());
  const { decision, reason } = decideBash(raw, {
    cwd,
    agentType: String(input.agent_type ?? ""),
    subagent: Boolean(input.agent_id),
    scratchpad: sessionScratchpad({
      scratchpadDir: typeof input.scratchpad_dir === "string" ? input.scratchpad_dir : "",
      sessionIds: [input.session_id, process.env.CLAUDE_CODE_SESSION_ID],
      projectDirs: [process.env.CLAUDE_PROJECT_DIR, cwd],
    }),
  });
  if (decision === "deny") deny(EVENT, `${reason}\nBlocked command: ${raw.slice(0, 200)}`);
  if (decision === "ask") ask(EVENT, `${reason}\nCommand: ${raw.slice(0, 200)}`);
}

await failOpen(main);
