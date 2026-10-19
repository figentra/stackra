#!/usr/bin/env node
// PostToolUse (Write|Edit|MultiEdit): report (never fix, never block) a written file that oxfmt would reformat.
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { readStdin, context } from "./_io.mjs";

const input = await readStdin();
const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
const file = String(input.tool_input?.file_path ?? "");
const oxfmt = `${root}/node_modules/.bin/oxfmt`;

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
process.exit(0);
