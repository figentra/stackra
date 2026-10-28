#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: PostToolUse (Write|Edit|MultiEdit): report (never fix, never block) a written file that oxfmt would
 *          reformat. Best-effort only — a missing binary, an unbuilt workspace or any other failure is swallowed via
 *          failOpen; the write already happened.
 * Boundary: reports only; runs the repository oxfmt in check mode on the written file, never writes.
 * Runtime: node (agent hook)
 * Governing contract: ADR 0016 (agents source of truth).
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve, sep } from "node:path";
import { readStdin, context, failOpen } from "./_io.mjs";

async function main() {
  const input = await readStdin();
  const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
  const file = String(input.tool_input?.file_path ?? "");
  const oxfmt = `${root}/node_modules/.bin/oxfmt`;

  // A file outside the repository (the scratchpad, another checkout) is not this repo's to format.
  if (file && !resolve(root, file).startsWith(resolve(root) + sep)) return;
  if (
    file &&
    existsSync(file) &&
    existsSync(oxfmt) &&
    /\.(ts|tsx|js|mjs|cjs|json|jsonc|md|mdx|yaml|yml|css)$/.test(file) &&
    !/(^|\/)(node_modules|dist)\//.test(file)
  ) {
    try {
      execFileSync(oxfmt, ["--check", file], { cwd: root, stdio: "ignore" });
    } catch (e) {
      // A non-zero exit with a numeric status means "needs formatting"; spawn failures stay silent.
      if (typeof e.status === "number")
        context(
          "PostToolUse",
          `[CHECKS] ${file} is not oxfmt-formatted. Run \`pnpm exec oxfmt ${file}\`.`,
        );
    }
  }
}

await failOpen(main);
