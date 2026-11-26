/**
 * Stackra file contract:
 * Purpose: `EAS_PREFLIGHT_COMMAND`, `stackra eas-preflight` (`pnpm eas:preflight`): the checks before a local EAS
 *          build and the record after it (STA-1577) (was `tools/scripts/eas-preflight.mjs`).
 *            check  --platform ios|android [--deployed-sha <sha>]: refuses a dirty tree, a HEAD that is not the
 *                   deployed sha, and too little free disk. The deployed sha is `--deployed-sha`, else
 *                   `STACKRA_DEPLOYED_SHA`, else the head of origin/main, which is what `pnpm runway deploy` ships.
 *            record --platform ios|android --build-id <id> [--rollout-id <id>] [--profile <name>]: appends one JSON
 *                   line to `RECORD_PATH`.
 * Boundary: runs git and reads the file system; never runs eas, reads no secret and writes only the record file.
 * Runtime: node
 * Governing contract: ADR 0180 (mobile builds and updates); ADR 0170 (deploy from a commit of main); STA-1577. ADR 0282 (decision 3).
 */
import { execFileSync } from "node:child_process";
import { appendFileSync, mkdirSync, statfsSync } from "node:fs";
import { dirname, join } from "node:path";

import { MIN_FREE_BYTES } from "#node/eas-preflight/constants/min-free-bytes.constant";
import { RECORD_PATH } from "#node/eas-preflight/constants/record-path.constant";
import { preflightProblems } from "#node/eas-preflight/functions/preflight-problems.function";
import { recordLine } from "#node/eas-preflight/functions/record-line.function";
import { workspaceRoot } from "#node/functions/workspace-root.function";
import type { CliCommand } from "#node/types/cli-command.type";

const USAGE =
  "usage: pnpm eas:preflight check --platform ios|android [--deployed-sha <sha>] | record --platform ios|android --build-id <id> [--rollout-id <id>] [--profile <name>]";

/** The `stackra eas-preflight` command. */
export const EAS_PREFLIGHT_COMMAND: CliCommand = {
  name: "eas-preflight",
  summary:
    "Check a local EAS build may start (clean tree, deployed sha, free disk), or record its build id",
  usage:
    "stackra eas-preflight check --platform ios|android [--deployed-sha <sha>] | record --platform ios|android --build-id <id> [--rollout-id <id>] [--profile <name>]",
  options: {
    platform: { type: "string" },
    "deployed-sha": { type: "string" },
    "build-id": { type: "string" },
    "rollout-id": { type: "string" },
    profile: { type: "string" },
  },
  positionals: true,
  async run({ cwd, values, positionals, io }) {
    const root = workspaceRoot(cwd);
    const git = (args: string[]): string =>
      execFileSync("git", args, {
        cwd: root,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      }).trim();
    const text = (name: string): string | undefined => {
      const value = values[name];
      return typeof value === "string" ? value : undefined;
    };
    try {
      const [command] = positionals;
      const platform = text("platform");
      const head = git(["rev-parse", "HEAD"]);
      if (command === "check") {
        let deployedSha = text("deployed-sha") ?? process.env["STACKRA_DEPLOYED_SHA"];
        if (!deployedSha) {
          git(["fetch", "--quiet", "origin", "main"]);
          deployedSha = git(["rev-parse", "origin/main"]);
          io.out(
            `deployed sha: head of origin/main ${deployedSha} (backend sha unknown until STA-136)\n`,
          );
        }
        const { bavail, bsize } = statfsSync(root);
        const found = preflightProblems({
          platform,
          dirty: git(["status", "--porcelain"]) !== "",
          head,
          deployedSha: git(["rev-parse", deployedSha]),
          freeBytes: Number(bavail) * Number(bsize),
        });
        for (const line of found) io.err(`eas-preflight: ${line}\n`);
        if (found.length > 0) return 1;
        io.out(`eas-preflight: ok, ${platform} at ${head}\n`);
        return 0;
      }
      if (command === "record") {
        if (platform === undefined || MIN_FREE_BYTES[platform] === undefined)
          throw new Error(USAGE);
        const path = join(root, RECORD_PATH);
        mkdirSync(dirname(path), { recursive: true });
        appendFileSync(
          path,
          recordLine({
            at: new Date().toISOString(),
            platform,
            profile: text("profile"),
            sha: head,
            buildId: text("build-id"),
            rolloutId: text("rollout-id"),
          }),
        );
        io.out(`recorded in ${RECORD_PATH}\n`);
        return 0;
      }
      throw new Error(USAGE);
    } catch (error) {
      io.err(`eas-preflight: ${error instanceof Error ? error.message : String(error)}\n`);
      return 1;
    }
  },
};
