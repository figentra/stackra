/**
 * Stackra file contract:
 * Purpose: proves `decideMode` turns colour off for NO_COLOR, --no-ansi, no TTY and TERM=dumb, on for --ansi and
 *          FORCE_COLOR, picks the depth, prompts only on a terminal outside CI, and falls back to ASCII.
 * Boundary: unit test.
 * Runtime: node
 * Governing contract: STA-1730 spec FR-020, FR-021 and FR-023; ADR 0022 (test placement).
 */
// @covers sta-1730:FR-020 sta-1730:FR-021 sta-1730:FR-023
import { decideMode } from "#core/functions/decide-mode.function";
import type { ConsolePorts } from "#core/types/console-ports.type";
import type { GlobalFlags } from "#core/types/global-flags.type";

const GLOBALS: GlobalFlags = {
  help: false,
  version: false,
  verbose: false,
  quiet: false,
  interaction: true,
  json: false,
  ansi: undefined,
};

const ports = (env: Record<string, string>, tty = true): ConsolePorts => ({
  stdout: { write: () => undefined },
  stderr: { write: () => undefined },
  stdoutIsTTY: tty,
  stdinIsTTY: tty,
  env,
  cwd: "/work",
  columns: 200,
  signals: { on: () => () => undefined },
  prompter: () => ({ ask: async () => "" }),
});

describe("decideMode", () => {
  it.each([
    [{}, true, undefined, 8],
    [{ COLORTERM: "truecolor" }, true, undefined, 24],
    [{ NO_COLOR: "1" }, true, undefined, 0],
    [{ TERM: "dumb" }, true, undefined, 0],
    [{ CI: "1" }, true, undefined, 0],
    [{ CI: "1" }, true, true, 8],
    [{}, false, undefined, 0],
    [{}, true, false, 0],
    [{}, false, true, 8],
    [{ NO_COLOR: "1", FORCE_COLOR: "1" }, false, undefined, 4],
  ] as const)("env %j, tty %s, --ansi %s gives depth %s", (env, tty, ansi, depth) => {
    expect(decideMode(ports({ ...env }, tty), { ...GLOBALS, ansi }).depth).toBe(depth);
  });

  it("prompts only on a terminal, outside CI, without --no-interaction or --json", () => {
    expect(decideMode(ports({}), GLOBALS).interactive).toBe(true);
    expect(decideMode(ports({ CI: "true" }), GLOBALS).interactive).toBe(false);
    expect(decideMode(ports({}, false), GLOBALS).interactive).toBe(false);
    expect(decideMode(ports({}), { ...GLOBALS, interaction: false }).interactive).toBe(false);
    expect(decideMode(ports({}), { ...GLOBALS, json: true })).toMatchObject({
      interactive: false,
      depth: 0,
    });
  });

  it("writes visual right-to-left text only on terminals without bidi, unless STACKRA_BIDI says otherwise", () => {
    expect(decideMode(ports({ TERM_PROGRAM: "claude-desktop" }), GLOBALS).bidi).toBe("visual");
    expect(decideMode(ports({ TERM_PROGRAM: "Apple_Terminal" }), GLOBALS).bidi).toBe("logical");
    expect(decideMode(ports({ TERM_PROGRAM: "vscode" }, false), GLOBALS).bidi).toBe("logical");
    expect(decideMode(ports({ TERM_PROGRAM: "vscode" }), { ...GLOBALS, json: true }).bidi).toBe(
      "logical",
    );
    expect(
      decideMode(ports({ TERM_PROGRAM: "vscode", STACKRA_BIDI: "logical" }), GLOBALS).bidi,
    ).toBe("logical");
    expect(decideMode(ports({ STACKRA_BIDI: "visual" }), GLOBALS).bidi).toBe("visual");
  });

  it("uses ASCII on TERM=linux or a non-UTF-8 locale, and caps the width at 100", () => {
    expect(decideMode(ports({ TERM: "linux" }), GLOBALS).unicode).toBe(false);
    expect(decideMode(ports({ LANG: "C" }), GLOBALS).unicode).toBe(false);
    expect(decideMode(ports({ LANG: "en_US.UTF-8" }), GLOBALS)).toMatchObject({
      unicode: true,
      columns: 100,
    });
  });
});
