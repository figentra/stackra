/**
 * Stackra file contract:
 * Purpose: unit tests of `encoreCloudLink`: it probes with `encore secret list` in the member root under a time limit;
 *          exit 0 is linked; any other exit is not, with Encore's last error line as the reason (Encore 1.58.8's
 *          logged-out answer verbatim) or the exit code when Encore printed nothing.
 * Boundary: test only; `runProcess` is replaced by a fake, so no `encore` starts.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); STA-2794.
 */
import { beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { encoreCloudLink } from "#node/encore/functions/encore-cloud-link.function";
import { runProcess } from "#node/functions/run-process.function";

vi.mock("#node/functions/run-process.function", () => ({ runProcess: vi.fn() }));

const spawn = vi.mocked(runProcess);

/** What Encore 1.58.8 prints for `encore secret list` with no login (box 2, 2026-11-26). */
const LOGGED_OUT =
  "error: POST /graphql: Post \"https://api.encore.dev/graphql\": not logged in: run 'encore auth login' first\n";

beforeEach(() => {
  spawn.mockReset();
});

describe("encoreCloudLink", () => {
  it("asks Encore for the app's secrets in the member root, with a time limit", async () => {
    spawn.mockResolvedValue(0);
    expect(await encoreCloudLink("/repo/services/notes")).toEqual({ linked: true });
    expect(spawn).toHaveBeenCalledWith(
      {
        command: "encore",
        args: ["secret", "list"],
        cwd: "/repo/services/notes",
        timeoutMs: expect.any(Number),
      },
      expect.objectContaining({ inherit: false }),
    );
  });

  it("is not linked when Encore is logged out, with Encore's reason", async () => {
    spawn.mockImplementation(async (_run, io) => {
      io.err(LOGGED_OUT);
      return 1;
    });
    expect(await encoreCloudLink("/repo/services/notes")).toEqual({
      linked: false,
      reason:
        "POST /graphql: Post \"https://api.encore.dev/graphql\": not logged in: run 'encore auth login' first",
    });
  });

  it("names the exit code when Encore said nothing", async () => {
    spawn.mockResolvedValue(124);
    expect(await encoreCloudLink("/repo/services/notes")).toEqual({
      linked: false,
      reason: "encore secret list exited 124",
    });
  });
});
