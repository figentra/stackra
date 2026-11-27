/**
 * Stackra file contract:
 * Purpose: `devLane(root, env)`, the dev lane of a repository: the number in the variable the root runway's
 *          `environments.dev.lanes.from` names (`STACKRA_LANE` by default) when it is set; otherwise, when the
 *          repository index table (`lanes.repos`) lists this repository (its `product.key`, else its `project`), that
 *          index × `lanes.worktrees` (10 by default) + the worktree number in `STACKRA_WORKTREE` (0 by default), so
 *          products side by side (os, pay, tamo) no longer all claim lane 0; otherwise 0. Lanes off is lane 0.
 * Boundary: pure over the parsed root runway and the given environment variables. The same table `checkPorts` checks
 *           (STA-863), so a lane it derives is one `checkPorts` proved free of collisions.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (decision 1); STA-863; STA-2001 (plan PR 8); STA-2840.
 */
import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";

/** Worktrees per repository when the table does not say (as `checkPorts`). */
const DEFAULT_WORKTREES = 10;

/** The root runway fields the lane reads, from a runway parsed as plain YAML. */
type LaneRoot = {
  readonly project?: unknown;
  readonly product?: { readonly key?: unknown } | undefined;
  readonly environments?:
    | {
        readonly dev?:
          | {
              readonly lanes?:
                | {
                    readonly enabled?: boolean | undefined;
                    readonly from?: string | undefined;
                    readonly repos?: Readonly<Record<string, number>> | undefined;
                    readonly worktrees?: number | undefined;
                  }
                | undefined;
            }
          | undefined;
      }
    | undefined;
};

/** `value` as a lane number, refusing anything but a whole number from 0. */
function whole(name: string, value: string): number {
  if (!/^\d+$/.test(value.trim()))
    throw new RunwayUnresolvedError(`${name} must be a whole number from 0, not "${value}"`);
  return Number(value.trim());
}

/**
 * The repository's dev lane.
 *
 * @param root - the root runway, parsed.
 * @param env - the environment variables (`process.env` in a run).
 * @throws RunwayUnresolvedError when the lane or worktree variable is not a whole number, or the worktree number is not
 *         below `lanes.worktrees`.
 * @example
 * devLane({ product: { key: "pay" }, environments: { dev: { lanes: { repos: { os: 0, pay: 1 } } } } }, {}); // 10
 */
export function devLane(root: LaneRoot, env: Readonly<Record<string, string | undefined>>): number {
  const lanes = root.environments?.dev?.lanes;
  if (lanes?.enabled === false) return 0;
  const from = lanes?.from ?? "STACKRA_LANE";
  const set = env[from];
  if (set !== undefined && set.trim() !== "") return whole(from, set);
  const key =
    typeof root.product?.key === "string"
      ? root.product.key
      : typeof root.project === "string"
        ? root.project
        : undefined;
  const index = key === undefined ? undefined : lanes?.repos?.[key];
  if (index === undefined) return 0;
  const worktrees = lanes?.worktrees ?? DEFAULT_WORKTREES;
  const worktree = whole("STACKRA_WORKTREE", env["STACKRA_WORKTREE"] ?? "0");
  if (worktree >= worktrees)
    throw new RunwayUnresolvedError(
      `STACKRA_WORKTREE ${worktree} is not below environments.dev.lanes.worktrees (${worktrees})`,
    );
  return index * worktrees + worktree;
}
