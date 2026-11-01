/**
 * Stackra file contract:
 * Purpose: `decideGround(env)`, whether the terminal background is dark or light: `STACKRA_GROUND=dark|light` first,
 *          then the background index of `COLORFGBG` (0 to 6 and 8 are dark), and dark when nothing says.
 * Boundary: pure; never queries the terminal.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-016.
 */
import type { ConsolePorts } from "#core/types/console-ports.type";

/** The terminal ground `env` describes. */
export function decideGround(env: ConsolePorts["env"]): "dark" | "light" {
  const choice = env["STACKRA_GROUND"];
  if (choice === "dark" || choice === "light") return choice;
  const background = Number(env["COLORFGBG"]?.split(";").at(-1));
  if (Number.isInteger(background) && background >= 0 && background <= 15)
    return background <= 6 || background === 8 ? "dark" : "light";
  // shortcut: few terminals set COLORFGBG and most developer terminals are dark; an OSC 11 query would be async.
  return "dark";
}
