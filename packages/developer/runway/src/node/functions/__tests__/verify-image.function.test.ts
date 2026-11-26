/**
 * Stackra file contract:
 * Purpose: unit tests of `verifyImage`: it checks the signature and then the CycloneDX attestation against the
 *          reference by digest with one trust root (keyless signer and repository, or a KMS key), turns a cosign
 *          failure into a `verify` refusal, and refuses a tag or an unusable trust root before cosign runs.
 * Boundary: test only; a recording fake runs cosign.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0174 (decision 2, cosign verification at deploy); STA-609.
 */
import { describe, expect, it } from "@stackra/testing";

import { RunwayImageRejectedError } from "#core/errors/runway-image-rejected.error";
import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { verifyImage } from "#node/functions/verify-image.function";
import type { CommandRunner } from "#node/types/command-runner.type";

const REFERENCE = `registry.example.com:5000/acme/core@sha256:${"c".repeat(64)}`;

/** A cosign that records its calls and fails the subcommand named in `fail`. */
function fake(fail?: string) {
  const calls: (readonly string[])[] = [];
  const run: CommandRunner = async (command, args) => {
    calls.push([command, ...args]);
    if (args[0] === fail) throw new Error(`cosign ${fail} failed: no matching signatures`);
    return "";
  };
  return { run, calls };
}

describe("verifyImage", () => {
  /** The keyless signer is pinned to Runway's workflow and to the repository whose job signed. */
  it("verifies the signature and the SBOM attestation against the keyless signer", async () => {
    const { run, calls } = fake();
    await verifyImage({ reference: REFERENCE, sourceRepository: "acme/app", run });
    const trust = [
      "--certificate-identity-regexp",
      "^https://github\\.com/stackra-inc/stackra/\\.github/workflows/runway-image\\.yml@",
      "--certificate-oidc-issuer",
      "https://token.actions.githubusercontent.com",
      "--certificate-github-workflow-repository",
      "acme/app",
    ];

    expect(calls).toEqual([
      ["cosign", "verify", ...trust, REFERENCE],
      ["cosign", "verify-attestation", "--type", "cyclonedx", ...trust, REFERENCE],
    ]);
  });

  it("verifies with a KMS key and a custom signer identity is not used", async () => {
    const { run, calls } = fake();
    await verifyImage({ reference: REFERENCE, key: "gcpkms://projects/p/keys/k", run });

    expect(calls[0]).toEqual([
      "cosign",
      "verify",
      "--key",
      "gcpkms://projects/p/keys/k",
      REFERENCE,
    ]);
  });

  it("pins the identity a caller passes", async () => {
    const { run, calls } = fake();
    await verifyImage({ reference: REFERENCE, sourceRepository: "acme/app", identity: "^x$", run });

    expect(calls[0]?.[3]).toBe("^x$");
  });

  /** A missing signature or attestation stops the deploy. */
  it.each(["verify", "verify-attestation"])("refuses the image when %s fails", async (fail) => {
    const { run } = fake(fail);
    const failed = verifyImage({ reference: REFERENCE, sourceRepository: "acme/app", run });

    await expect(failed).rejects.toThrow(RunwayImageRejectedError);
    await expect(failed).rejects.toMatchObject({ step: "verify", image: REFERENCE });
  });

  /** A tag can move after the check, so only a digest is verified; the trust root is checked first too. */
  it.each([
    ["a tag", { reference: "registry.example.com/acme/core:1.0.0", sourceRepository: "acme/app" }],
    ["no repository", { reference: REFERENCE }],
    ["a key file", { reference: REFERENCE, key: "./cosign.pub" }],
  ])("refuses %s before cosign runs", async (_name, input) => {
    const { run, calls } = fake();

    await expect(verifyImage({ ...input, run })).rejects.toThrow(RunwayUnresolvedError);
    expect(calls).toEqual([]);
  });
});
