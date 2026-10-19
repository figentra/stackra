#!/usr/bin/env node
// PreToolUse (all tools): every PHASE_SIZE-th tool call in a session, remind the agent to work in phases.
// The count lives in a per-session file under the OS temp dir (Claude Code sets no counter env var).
import { readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readStdin, context } from "./_io.mjs";

const PHASE_SIZE = 10;
const input = await readStdin();
const id = String(input.session_id ?? "unknown").replace(/[^\w-]/g, "_");
const file = join(tmpdir(), `claude-context-health-${id}`);

let count = 0;
try {
  count = parseInt(readFileSync(file, "utf8"), 10) || 0;
} catch {}
count += 1;
try {
  writeFileSync(file, String(count));
} catch {}

if (count % PHASE_SIZE === 0) {
  context(
    "PreToolUse",
    [
      `[CONTEXT HEALTH — Phase ${count / PHASE_SIZE}]`,
      `Tool calls: ${count} | Consider:`,
      "- Complete current unit of work",
      "- Summarize progress in a mission log",
      "- Run `/compact` to reset context before the next phase",
      "- Load only needed files for next task",
    ].join("\n"),
  );
}
process.exit(0);
