/**
 * Stackra file contract:
 * Purpose: `migrationRelease(option, io, env)`, the release a migrate command names to the database runner: the
 *          `--release` option, else `STACKRA_RELEASE`, else the commit the member's checkout is at (`git rev-parse
 *          HEAD`, the commit a deploy ships and records when it is given no sha). The one chain both `stackra db
 *          migrate` (@stackra/cli) and the member console's `db:migrate` (@stackra/database) use, so a deploy that
 *          runs either in its checkout names its release without a flag, which a contract step's release gate compares.
 * Boundary: runs `git` through `io.process` in `io.cwd` and reads no database; the variables come from the caller (this
 *           entry never reads `process`). `undefined` outside a git checkout or without git: the runner then applies
 *           plain additive files as before and refuses, naming `--release` and `STACKRA_RELEASE`, a forward-only run
 *           holding a contract step. The value is passed as found; the runner checks its shape.
 * Runtime: isomorphic
 * Governing contract: ADR 0159 (decision 3; the 2026-10-24 note: `stackra db migrate` is the release step); ADR 0352
 *                     (the deploy's commit); STA-1406.
 */
import type { CommandIo } from "#core/types/command-io.type";

/** A full commit id (SHA-1, or SHA-256 in a repository that uses it). */
const COMMIT = /^[0-9a-f]{40}(?:[0-9a-f]{24})?$/;

/**
 * The release a migrate run applies.
 *
 * @param option - the `--release` option, when given.
 * @param io - the folder whose checkout is read and the process runner.
 * @param env - the variables `STACKRA_RELEASE` is read from (`process.env` in a command).
 * @example
 * await migrationRelease(this.release, io, process.env); // "4f1c…" (the checkout's commit) unless one is named
 */
export async function migrationRelease(
  option: string | undefined,
  io: Pick<CommandIo, "cwd" | "process">,
  env: Readonly<Record<string, string | undefined>>,
): Promise<string | undefined> {
  const named = option?.trim() || env["STACKRA_RELEASE"]?.trim();
  if (named) return named;
  try {
    const { code, output } = await io.process.run(
      "git",
      ["rev-parse", "--verify", "--quiet", "HEAD"],
      { cwd: io.cwd, check: false },
    );
    const commit = output.trim();
    return code === 0 && COMMIT.test(commit) ? commit : undefined;
  } catch {
    // no git on the host: the runner names both ways to set the release when one is needed
    return undefined;
  }
}
