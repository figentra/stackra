/**
 * Stackra file contract:
 * Purpose: tests of `PROCESS_HOST.run`, which starts a real child: its exit code comes back with the environment it
 *          was given, a child ended by a signal reports 128 plus the signal number, and a command that cannot start
 *          rejects.
 * Boundary: starts `node -e` children of this test only.
 * Runtime: node
 * Governing contract: ADR 0199 (amendment of 2026-11-27); ADR 0022 (test placement).
 */
import { PROCESS_HOST } from "#node/constants/process-host.constant";

describe("PROCESS_HOST.run", () => {
  it("resolves with the child's exit code and passes the environment", async () => {
    expect(
      await PROCESS_HOST.run(
        process.execPath,
        ["-e", "process.exit(process.env.STACKRA_REGISTRY === 'https://r.test/' ? 7 : 1)"],
        { ...process.env, STACKRA_REGISTRY: "https://r.test/" },
      ),
    ).toBe(7);
  });

  it("reports a child ended by a signal as 128 plus its number", async () => {
    expect(
      await PROCESS_HOST.run(process.execPath, ["-e", "process.kill(process.pid, 'SIGTERM')"], {
        ...process.env,
      }),
    ).toBe(143);
  });

  it("rejects when the command cannot start", async () => {
    await expect(
      PROCESS_HOST.run("create-stackra-no-such-binary", [], { PATH: "" }),
    ).rejects.toThrow(/ENOENT/);
  });
});
