/**
 * Stackra file contract:
 * Purpose: `committedMigrationDrift(cwd)`, the compiled migration files of the member at `cwd` that differ from its
 *          checkout's commit: each `.sql` file of `.stackra/migrations` that is changed, staged, deleted, untracked or
 *          ignored, so a release that applies the stream applies the committed SQL or nothing (STA-2788, the rule
 *          runway's `encoreDeployTree` holds an Encore deploy to). `undefined` when no `.git` sits at `cwd` or above:
 *          an installed artifact, whose stream is the SQL that shipped.
 * Boundary: reads only; runs `git status` without optional locks, so a read-only checkout works. A checkout git cannot
 *           read (no git, a dubious-ownership refusal) throws rather than passing unchecked.
 * Runtime: node
 * Governing contract: ADR 0159 (decision 2 as amended: `stackra db migrate` is the release step; decision 3: the SQL
 *                     Squawk lints); STA-2788 (the committed compiled migrations are what deploys).
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

/** A member's compiled migration stream (`@stackra/gen`'s `MIGRATIONS_DIR`), committed (STA-2788). */
const MIGRATIONS = ".stackra/migrations";

/** Whether `dir` or a parent holds `.git` (a folder, or the file a linked worktree has). */
function insideCheckout(dir: string): boolean {
  for (let folder = resolve(dir); ; folder = dirname(folder)) {
    if (existsSync(join(folder, ".git"))) return true;
    if (dirname(folder) === folder) return false;
  }
}

/**
 * The repository-relative paths of the member's compiled migrations that differ from the commit.
 *
 * @param cwd - the member root.
 * @returns the differing `.sql` paths, sorted (empty when the stream is the commit's), or `undefined` outside a checkout.
 * @throws Error when a `.git` is present but git cannot read the checkout.
 * @example
 * committedMigrationDrift("services/billing"); // ["services/billing/.stackra/migrations/0002_add_status.up.sql"]
 */
export function committedMigrationDrift(cwd: string): readonly string[] | undefined {
  if (!insideCheckout(cwd)) return undefined;
  let status: string;
  try {
    // Untracked and ignored files list one by one (`--untracked-files=all` with `--ignored=traditional`), so an
    // uncommitted stream under an ignore rule counts too; `-z` keeps every path verbatim.
    status = execFileSync(
      "git",
      [
        "--no-optional-locks",
        "status",
        "--porcelain=v1",
        "-z",
        "--untracked-files=all",
        "--ignored=traditional",
        "--",
        MIGRATIONS,
      ],
      { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 64 * 1024 * 1024 },
    );
  } catch (error) {
    const stderr = (error as { stderr?: unknown }).stderr;
    const reason =
      typeof stderr === "string" && stderr.trim() !== ""
        ? stderr.trim()
        : error instanceof Error
          ? error.message
          : String(error);
    throw new Error(`git cannot read the checkout at ${cwd}: ${reason}`, { cause: error });
  }
  const paths = new Set<string>();
  const entries = status.split("\0");
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index] ?? "";
    if (entry.length < 4) continue;
    paths.add(entry.slice(3));
    // A rename or copy entry is followed by its source path, which also left or changed the committed stream.
    if (/[RC]/.test(entry.slice(0, 2))) {
      index += 1;
      paths.add(entries[index] ?? "");
    }
  }
  return [...paths].filter((path) => path.endsWith(".sql")).toSorted();
}
