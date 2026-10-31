/**
 * Stackra file contract:
 * Purpose: `deployPreflight({ command, sha, git })`, the full SHA a `runway deploy` or `runway promote` ships, after
 *          its checks: deploy needs a clean tree whose HEAD is the head of origin/main; promote needs `sha` on
 *          origin/main.
 * Boundary: runs git only through the `git` it is given (trimmed stdout, throws on a non-zero exit).
 * Runtime: node
 * Governing contract: ADR 0170 (DP6: production through `runway promote`); STA-268.
 */

/**
 * The full SHA a deploy or promote ships.
 *
 * @throws Error naming the reason when a check fails.
 * @example
 * deployPreflight({ command: "promote", sha: "0123abc", git }); // "0123abc…" (40 hex)
 */
export function deployPreflight({
  command,
  sha,
  git,
}: {
  readonly command: "deploy" | "promote";
  readonly sha?: string | undefined;
  readonly git: (args: readonly string[]) => string;
}): string {
  git(["fetch", "--quiet", "origin", "main"]);
  const mainSha = git(["rev-parse", "origin/main"]);
  if (command === "deploy") {
    if (git(["status", "--porcelain"]) !== "")
      throw new Error(
        "the working tree has uncommitted changes; deploy from a clean checkout of main",
      );
    const head = git(["rev-parse", "HEAD"]);
    if (head !== mainSha)
      throw new Error(
        `HEAD ${head} is not the head of origin/main (${mainSha}); check out main and pull, then run it again`,
      );
    return head;
  }
  let full: string;
  try {
    full = git(["rev-parse", "--verify", "--quiet", `${sha}^{commit}`]);
  } catch {
    throw new Error(`"${sha}" names no commit here; fetch it first`);
  }
  try {
    git(["merge-base", "--is-ancestor", full, mainSha]);
  } catch {
    throw new Error(`${full} is not on origin/main; only commits of main are promoted`);
  }
  return full;
}
