#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: PreToolUse (Bash): the permission tiers of ADR 0293 for a shell command. The rules live in `_rules.mjs`, shared
 * with the OpenCode guard; this hook only reads the payload (`cwd`, `agent_type`, `session_id`) and reports the
 * decision: deny, ask (a human confirms), or nothing (allow). Only the deletes and deploys in `HUMAN_ASKS` ask;
 * `_rules.mjs` turns every other ask into a deny with a rewrite hint, main thread and subagent alike (STA-400).
 * Accident guard, not a boundary: it fails open on its own errors.
 * Boundary: reads the hook payload and prints a decision; the rules live in `_rules.mjs`.
 * Runtime: node (agent hook)
 * Governing contract: ADR 0293; STA-400.
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
