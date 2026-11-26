/**
 * Stackra file contract:
 * Purpose: `runDevGen(context)`, the `stackra gen` run before `stackra dev --surface` and `--product` start anything,
 *          and whether they may go on. gen runs every member even after one refuses, writes what it can and exits 1,
 *          so one member's refusal must not stop every surface: dev goes on and says so. Any other failure stops it.
 * Boundary: runs gen through the in-process CLI; writes one line to `io.err` on a refusal. `stackra build` and
 *           `stackra gen --check` keep stopping on a refusal; this is the local dev loop only.
 * Runtime: node
 * Governing contract: ADR 0436 (decision 6: the local dev loop); STA-2664 item 13.
 */
import type { CliContext } from "#node/types/cli-context.type";

/** The exit code `stackra gen` answers when a member refused and every other member was written. */
const REFUSED = 1;

/**
 * Runs `stackra gen` for a dev run and resolves true when the run may go on.
 *
 * @param context - the dev command's context; only its `cli` and `io` are used.
 * @example
 * if (!(await runDevGen(context))) return 1;
 */
export async function runDevGen(context: Pick<CliContext, "cli" | "io">): Promise<boolean> {
  const code = await context.cli(["gen"], context.io);
  if (code === REFUSED)
    context.io.err(
      "stackra dev: gen refused a member (its refusals are above); serving with what gen wrote\n",
    );
  return code === 0 || code === REFUSED;
}
