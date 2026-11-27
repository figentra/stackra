/**
 * Stackra file contract:
 * Purpose: unit tests of `verifyImage`: it checks the signature and then the CycloneDX attestation against the
 *          reference by digest with one trust root (keyless signer, repository and caller ref, or a KMS key with the
 *          log check skipped or a trusted root), turns a cosign failure into a `verify` refusal, refuses a tag or an
 *          unusable trust root before cosign runs, and refuses a keyless certificate made by a workflow on a branch
 *          that is not main or by Runway's workflow at a branch of its own (the impostor signer).
 * Boundary: test only; a recording fake runs cosign, and a second fake checks a keyless certificate's claims as
 *           cosign does with the flags it is given.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0174 (decision 2, cosign verification at deploy); STA-609.
 */
import { describe, expect, it } from "@stackra/testing";

import { RunwayImageRejectedError } from "#core/errors/runway-image-rejected.error";
import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { IMAGE_SUPPLY_CHAIN_SETTINGS } from "#node/constants/image-supply-chain-settings.constant";
import { verifyImage } from "#node/functions/verify-image.function";
import type { CommandRunner } from "#node/types/command-runner.type";

const REFERENCE = `registry.example.com:5000/acme/core@sha256:${"c".repeat(64)}`;
const SIGNER = "https://github.com/stackra-inc/stackra/.github/workflows/runway-image.yml";
const RELEASE = "d".repeat(40);

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

/** The claims of a keyless Fulcio certificate a GitHub job got. */
type Certificate = { san: string; issuer: string; repository: string; ref: string };

/**
 * A cosign that holds one keyless signature and checks its certificate as cosign does: each claim is compared only
 * when its flag is given (the identity as an RE2 pattern, the rest exactly).
 */
function signedBy(certificate: Certificate): CommandRunner {
  return async (_command, args) => {
    const flag = (name: string): string | undefined => {
      const at = args.indexOf(name);
      return at === -1 ? undefined : args[at + 1];
    };
    const identity = flag("--certificate-identity-regexp");
    const checks: [string | undefined, (value: string) => boolean][] = [
      [identity, (pattern) => new RegExp(pattern).test(certificate.san)],
      [flag("--certificate-oidc-issuer"), (issuer) => issuer === certificate.issuer],
      [flag("--certificate-github-workflow-repository"), (repo) => repo === certificate.repository],
      [flag("--certificate-github-workflow-ref"), (ref) => ref === certificate.ref],
    ];
    if (identity === undefined) throw new Error("no identity to check the certificate against");
    for (const [value, holds] of checks)
      if (value !== undefined && !holds(value))
        throw new Error("none of the expected identities matched what was in the certificate");
    return "";
  };
}

/** The certificate of `runway-image.yml` at a release commit, called from acme/app's main. */
const GATE: Certificate = {
  san: `${SIGNER}@${RELEASE}`,
  issuer: IMAGE_SUPPLY_CHAIN_SETTINGS.oidcIssuer,
  repository: "acme/app",
  ref: "refs/heads/main",
};

describe("verifyImage", () => {
  /** The keyless signer is pinned to Runway's workflow, the repository whose job signed and that job's ref. */
  it("verifies the signature and the SBOM attestation against the keyless signer", async () => {
    const { run, calls } = fake();
    await verifyImage({ reference: REFERENCE, sourceRepository: "acme/app", run });
    const trust = [
      "--certificate-identity-regexp",
      IMAGE_SUPPLY_CHAIN_SETTINGS.signerIdentity,
      "--certificate-oidc-issuer",
      "https://token.actions.githubusercontent.com",
      "--certificate-github-workflow-repository",
      "acme/app",
      "--certificate-github-workflow-ref",
      "refs/heads/main",
    ];

    expect(calls).toEqual([
      ["cosign", "verify", ...trust, REFERENCE],
      ["cosign", "verify-attestation", "--type", "cyclonedx", ...trust, REFERENCE],
    ]);
  });

  it("accepts the image the gate signed from the caller's main", async () => {
    await expect(
      verifyImage({ reference: REFERENCE, sourceRepository: "acme/app", run: signedBy(GATE) }),
    ).resolves.toBeUndefined();
  });

  /**
   * The bypass: a workflow pushed to a branch of the caller repository calls a copy of `runway-image.yml` (any commit
   * of stackra-inc/stackra or its fork network) with the main-only check and the Trivy gate removed. The certificate
   * still names Runway's workflow and the caller repository; only the caller's ref tells it apart.
   */
  it("refuses an image signed by a workflow on another branch of the caller", async () => {
    const failed = verifyImage({
      reference: REFERENCE,
      sourceRepository: "acme/app",
      run: signedBy({ ...GATE, ref: "refs/heads/try-image" }),
    });

    await expect(failed).rejects.toThrow(RunwayImageRejectedError);
    await expect(failed).rejects.toMatchObject({ step: "verify" });
  });

  it("refuses an image signed by Runway's workflow at a branch of stackra-inc/stackra", async () => {
    const failed = verifyImage({
      reference: REFERENCE,
      sourceRepository: "acme/app",
      run: signedBy({ ...GATE, san: `${SIGNER}@refs/heads/no-gate` }),
    });

    await expect(failed).rejects.toThrow(RunwayImageRejectedError);
  });

  it("accepts another caller ref only when the verifier names it", async () => {
    const tagged = signedBy({ ...GATE, ref: "refs/tags/v1.2.0" });

    await expect(
      verifyImage({ reference: REFERENCE, sourceRepository: "acme/app", run: tagged }),
    ).rejects.toThrow(RunwayImageRejectedError);
    await expect(
      verifyImage({
        reference: REFERENCE,
        sourceRepository: "acme/app",
        callerRef: "refs/tags/v1.2.0",
        run: tagged,
      }),
    ).resolves.toBeUndefined();
  });

  /** Air-gapped: the KMS signature carries no log entry, so the verify skips the log and reaches no Sigstore service. */
  it("verifies with a KMS key and no transparency log", async () => {
    const { run, calls } = fake();
    await verifyImage({ reference: REFERENCE, key: "gcpkms://projects/p/keys/k", run });

    expect(calls).toEqual([
      [
        "cosign",
        "verify",
        "--key",
        "gcpkms://projects/p/keys/k",
        "--insecure-ignore-tlog=true",
        REFERENCE,
      ],
      [
        "cosign",
        "verify-attestation",
        "--type",
        "cyclonedx",
        "--key",
        "gcpkms://projects/p/keys/k",
        "--insecure-ignore-tlog=true",
        REFERENCE,
      ],
    ]);
  });

  it("verifies with a KMS key against a private Sigstore's trusted root", async () => {
    const { run, calls } = fake();
    await verifyImage({
      reference: REFERENCE,
      key: "hashivault://images",
      trustedRoot: "/etc/sigstore/trusted_root.json",
      run,
    });

    expect(calls[0]).toEqual([
      "cosign",
      "verify",
      "--key",
      "hashivault://images",
      "--trusted-root",
      "/etc/sigstore/trusted_root.json",
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
    [
      "a short caller ref",
      { reference: REFERENCE, sourceRepository: "acme/app", callerRef: "main" },
    ],
  ])("refuses %s before cosign runs", async (_name, input) => {
    const { run, calls } = fake();

    await expect(verifyImage({ ...input, run })).rejects.toThrow(RunwayUnresolvedError);
    expect(calls).toEqual([]);
  });
});
