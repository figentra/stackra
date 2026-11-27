/**
 * Stackra file contract:
 * Purpose: unit tests of `RunwayImageVerifyCommand` on the console: it verifies the reference keyless against the
 *          job's GITHUB_REPOSITORY (or `--repository`, `--identity`) and the caller ref `--ref` (the verify's main by
 *          default), or against `--key` with no repository or caller ref, passes `--trusted-root`, prints the verified
 *          reference, and exits non-zero when the verify refuses the image.
 * Boundary: test only; the verify and the job's environment are replaced through their fields, so cosign never runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0174 (cosign verification at deploy); ADR 0506 (decision 8);
 *                     STA-609.
 */
import { runCommandForTest } from "@stackra/console/testing";
import { describe, expect, it } from "@stackra/testing";

import { RunwayImageRejectedError } from "#core/errors/runway-image-rejected.error";
import { RunwayImageVerifyCommand } from "#node/commands/runway-image-verify.command";
import type { ImageVerifyRequest } from "#node/types/image-verify-request.type";

const REFERENCE = `registry.example.com/acme-core@sha256:${"a".repeat(64)}`;

/** Runs the command with its verify recorded; `refuse` makes the verify refuse the image. */
async function run(
  argv: readonly string[],
  env: Record<string, string | undefined>,
  refuse = false,
) {
  const requests: Omit<ImageVerifyRequest, "run">[] = [];
  class Verify extends RunwayImageVerifyCommand {
    override env = env;

    override verify = async (request: ImageVerifyRequest): Promise<void> => {
      const { run: _run, ...rest } = request;
      requests.push(rest);
      if (refuse) throw new RunwayImageRejectedError("verify", request.reference, "no signatures");
    };
  }
  const result = await runCommandForTest([Verify], ["image:verify", ...argv], { cwd: "/work" });
  return { result, requests };
}

describe(RunwayImageVerifyCommand, () => {
  it("verifies keyless against the job's repository", async () => {
    const { result, requests } = await run([REFERENCE], { GITHUB_REPOSITORY: "acme/app" });

    expect(result.exitCode).toBe(0);
    expect(requests).toEqual([
      {
        reference: REFERENCE,
        key: undefined,
        sourceRepository: "acme/app",
        callerRef: undefined,
        identity: undefined,
        trustedRoot: undefined,
      },
    ]);
    expect(result.stdout + result.stderr).toContain(
      `${REFERENCE}: signature and SBOM attestation verified`,
    );
  });

  it("takes --repository and --identity, and a key with no repository", async () => {
    const keyless = await run([REFERENCE, "--repository", "acme/other", "--identity", "^x$"], {
      GITHUB_REPOSITORY: "acme/app",
    });
    const kms = await run([REFERENCE, "--key", "awskms:///alias/a"], {
      GITHUB_REPOSITORY: "acme/app",
    });

    expect(keyless.requests[0]).toMatchObject({ sourceRepository: "acme/other", identity: "^x$" });
    expect(kms.requests[0]).toMatchObject({
      key: "awskms:///alias/a",
      sourceRepository: undefined,
    });
  });

  it("passes the caller ref and the trusted root; a KMS key pins no caller ref", async () => {
    const keyless = await run(
      [REFERENCE, "--ref", "refs/tags/v1.2.0", "--trusted-root", "trusted_root.json"],
      { GITHUB_REPOSITORY: "acme/app" },
    );
    const kms = await run(
      [
        REFERENCE,
        "--key",
        "hashivault://images",
        "--ref",
        "refs/heads/x",
        "--trusted-root",
        "r.json",
      ],
      {},
    );

    expect(keyless.requests[0]).toMatchObject({
      callerRef: "refs/tags/v1.2.0",
      trustedRoot: "trusted_root.json",
    });
    expect(kms.requests[0]).toMatchObject({
      key: "hashivault://images",
      callerRef: undefined,
      trustedRoot: "r.json",
    });
  });

  it("fails when the verify refuses the image", async () => {
    const { result } = await run([REFERENCE], { GITHUB_REPOSITORY: "acme/app" }, true);

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain("the verify step refused the image");
  });
});
