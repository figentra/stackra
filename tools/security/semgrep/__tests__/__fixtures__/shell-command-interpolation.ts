/**
 * Stackra file contract:
 * Purpose: Semgrep test fixture for `stackra.shell-command-interpolation` (`ruleid:` lines must match, `ok:` must not).
 * Boundary: never imported or run; `semgrep --test` reads it (`pnpm security:sast --test`).
 * Runtime: none
 * Governing contract: tools/security/semgrep/rules/shell-command-interpolation.yml; ADR 0187 decision 3; STA-2821.
 */
import * as cp from "node:child_process";
import { exec, execFile, execSync, spawn } from "node:child_process";

declare const branch: string;

export function examples(): void {
  // ruleid: stackra.shell-command-interpolation
  exec(`git checkout ${branch}`);
  // ruleid: stackra.shell-command-interpolation
  execSync("git log " + branch);
  // ruleid: stackra.shell-command-interpolation
  cp.execSync(`rm -rf ${branch}`, { stdio: "inherit" });
  // ruleid: stackra.shell-command-interpolation
  spawn("git", ["log", branch], { shell: true });

  // ok: stackra.shell-command-interpolation
  execFile("git", ["checkout", branch]);
  // ok: stackra.shell-command-interpolation
  spawn("git", ["log", branch], { stdio: "inherit" });
  // ok: stackra.shell-command-interpolation
  execSync("git status --short");
}
