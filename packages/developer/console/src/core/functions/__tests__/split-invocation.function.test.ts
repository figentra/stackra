/**
 * Stackra file contract:
 * Purpose: proves `splitInvocation` lets an option that `valueFlag` names take the next token before the command name,
 *          keeping both in `rest` and `raw` in order, and leaves every other token as it was.
 * Boundary: unit test; a pure function.
 * Runtime: node
 * Governing contract: STA-1966 spec FR-012; ADR 0506 (amendment 2026-11-03); ADR 0022 (test placement).
 */
// @covers sta-1966:FR-012
import { splitInvocation } from "#core/functions/split-invocation.function";

const known = () => false;
const valueFlag = (token: string) => token === "--box" || token === "-b";

describe("splitInvocation", () => {
  it.each([
    [
      ["--box", "2", "ssh", "-v"],
      ["--box", "2", "-v"],
    ],
    [
      ["-b", "2", "ssh"],
      ["-b", "2"],
    ],
    [["--box=2", "ssh"], ["--box=2"]],
  ])("takes the value of a value option before the name in %j", (argv, rest) => {
    expect(splitInvocation(argv, known, valueFlag)).toEqual({ name: "ssh", rest, raw: rest });
  });

  it("takes no value without valueFlag, so the value reads as the name", () => {
    expect(splitInvocation(["--box", "2", "ssh"]).name).toBe("2");
  });

  it("takes no value for a flag valueFlag does not name, or after the name", () => {
    expect(splitInvocation(["--json", "ssh"], known, valueFlag)).toEqual({
      name: "ssh",
      rest: ["--json"],
      raw: ["--json"],
    });
    expect(splitInvocation(["ssh", "--box", "2"], known, valueFlag).rest).toEqual(["--box", "2"]);
  });

  it("keeps a trailing value option with no value", () => {
    expect(splitInvocation(["--box"], known, valueFlag)).toEqual({
      name: undefined,
      rest: ["--box"],
      raw: ["--box"],
    });
  });
});
