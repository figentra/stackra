#!/usr/bin/env node
/**
 * PreToolUse (Bash): the permission tiers of ADR 0293 for a shell command. The rules live in `_rules.mjs`, shared
 * with the OpenCode guard; this hook only reads the payload (`cwd`, `agent_type`) and reports the decision: deny,
 * ask (a human confirms), or nothing (allow). Accident guard, not a boundary: it fails open on its own errors.
 */
import { readStdin, deny, ask, failOpen } from "./_io.mjs";
import { decideBash } from "./_rules.mjs";

const EVENT = "PreToolUse";

async function main() {
  const input = await readStdin();
  const raw = String(input.tool_input?.command ?? "");
  const { decision, reason } = decideBash(raw, {
    cwd: String(input.cwd || process.cwd()),
    agentType: String(input.agent_type ?? ""),
  });
  if (decision === "deny") deny(EVENT, `${reason}\nBlocked command: ${raw.slice(0, 200)}`);
  if (decision === "ask") ask(EVENT, `${reason}\nCommand: ${raw.slice(0, 200)}`);
}

await failOpen(main);
