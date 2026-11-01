/**
 * Stackra file contract:
 * Purpose: `decideMode(ports, globals)`, the one decision of what a run may do: colour depth from `NO_COLOR`, `CI`,
 *          `FORCE_COLOR`, `COLORTERM`, `TERM`, `--ansi` and the TTY; prompts only on a terminal outside CI without
 *          `--no-interaction` or `--json`; ASCII on `TERM=linux` or a non-UTF-8 locale.
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-020, FR-021 and FR-023; https://no-color.org.
 */
import { VISUAL_BIDI_TERMINALS } from "#core/constants/visual-bidi-terminals.constant";
import type { ConsolePorts } from "#core/types/console-ports.type";
import type { ConsoleMode } from "#core/types/console-mode.type";
import type { GlobalFlags } from "#core/types/global-flags.type";

/** Whether an environment variable is set to something. */
const set = (value: string | undefined) => value !== undefined && value !== "";

/** The colour depth the environment allows when colour is on. */
function depthOf(env: ConsolePorts["env"]): 4 | 8 | 24 {
  const force = env["FORCE_COLOR"];
  if (force === "1") return 4;
  if (force === "2") return 8;
  if (force === "3" || /^(truecolor|24bit)$/i.test(env["COLORTERM"] ?? "")) return 24;
  return 8;
}

/** The mode of a run with these ports and global options. */
export function decideMode(ports: ConsolePorts, globals: GlobalFlags): ConsoleMode {
  const env = ports.env;
  const forced = set(env["FORCE_COLOR"]) && env["FORCE_COLOR"] !== "0";
  const colour =
    !globals.json &&
    (globals.ansi ??
      (forced ||
        (!set(env["NO_COLOR"]) && !set(env["CI"]) && ports.stdoutIsTTY && env["TERM"] !== "dumb")));
  const locale = env["LC_ALL"] ?? env["LC_CTYPE"] ?? env["LANG"];
  const unicode = env["TERM"] !== "linux" && (!set(locale) || /utf-?8/i.test(locale ?? ""));
  const bidiChoice = env["STACKRA_BIDI"];
  const visual =
    !globals.json &&
    ports.stdoutIsTTY &&
    (bidiChoice === "visual" ||
      (bidiChoice !== "logical" && VISUAL_BIDI_TERMINALS.has(env["TERM_PROGRAM"] ?? "")));
  return {
    bidi: visual ? "visual" : "logical",
    depth: colour ? depthOf(env) : 0,
    unicode,
    interactive:
      !globals.json &&
      globals.interaction &&
      ports.stdinIsTTY &&
      ports.stdoutIsTTY &&
      !set(env["CI"]),
    json: globals.json,
    quiet: globals.quiet,
    verbose: globals.verbose,
    animate: colour && ports.stdoutIsTTY,
    tty: ports.stdoutIsTTY,
    columns: Math.max(40, Math.min(ports.columns ?? 80, 100)),
  };
}
