/**
 * Stackra file contract:
 * Purpose: proves the node process runner captures standard output and error in order, runs in the given working
 *          directory with the extra environment, streams each chunk to the listener, and resolves a command that
 *          cannot start as exit 127 with the reason.
 * Boundary: unit test that spawns `node` itself.
 * Runtime: node
 * Governing contract: STA-1966 spec FR-007; ADR 0022 (test placement).
 */
// @covers sta-1966:FR-007
import { realpathSync } from "node:fs";
import { tmpdir } from "node:os";

import { NodeProcessRunnerDriver } from "#node/drivers/node-process-runner.driver";

const runner = new NodeProcessRunnerDriver();

describe("NodeProcessRunnerDriver", () => {
  it("captures both streams, in the working directory, with the extra environment", async () => {
    const directory = realpathSync(tmpdir());
    const chunks: string[] = [];
    const result = await runner.run(
      process.execPath,
      [
        "-e",
        "console.log(process.cwd()); console.error(process.env.STACKRA_PROBE); process.exit(3)",
      ],
      { cwd: directory, env: { STACKRA_PROBE: "probe" }, onOutput: (chunk) => chunks.push(chunk) },
    );
    expect(result.code).toBe(3);
    expect(result.output).toContain(directory);
    expect(result.output).toContain("probe");
    expect(chunks.join("")).toBe(result.output);
  });

  it("resolves a command that cannot start as exit 127 with the reason", async () => {
    const result = await runner.run("stackra-no-such-binary", [], { cwd: tmpdir() });
    expect(result.code).toBe(127);
    expect(result.output).toContain("stackra-no-such-binary");
  });
});
