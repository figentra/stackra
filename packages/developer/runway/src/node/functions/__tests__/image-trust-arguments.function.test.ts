/**
 * Stackra file contract:
 * Purpose: unit tests of `imageTrustArguments`: a KMS key of each accepted scheme signs with the signing config given
 *          and verifies with the transparency-log check skipped (air-gapped) or against the trusted root given;
 *          keyless verifies GitHub's OIDC issuer, Runway's signer identity, the caller repository and the caller's ref
 *          (main by default); the default signer identity accepts a commit, a `runway-v<n>` tag or Stackra's main and
 *          refuses a branch; a key file, a spaced key, a keyless call with no valid repository or caller ref, and a
 *          Sigstore file that cosign would read as a flag are refused.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0174 (decision 2); ADR 0019 (decision 1); STA-609.
 */
import { describe, expect, it } from "@stackra/testing";

import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { IMAGE_SUPPLY_CHAIN_SETTINGS } from "#node/constants/image-supply-chain-settings.constant";
import { imageTrustArguments } from "#node/functions/image-trust-arguments.function";

const SIGNER = "https://github.com/stackra-inc/stackra/.github/workflows/runway-image.yml";

describe("imageTrustArguments", () => {
  it.each(["awskms:///alias/a", "gcpkms://projects/p/k", "azurekms://v.vault/k", "hashivault://k"])(
    "signs with the KMS key %s and the signing config given",
    (key) => {
      expect(imageTrustArguments({ key, signingConfig: "/tmp/offline.json" }, "sign")).toEqual([
        "--key",
        key,
        "--signing-config",
        "/tmp/offline.json",
      ]);
    },
  );

  /** Air-gapped: the KMS signature wrote no log entry, so the verify must not ask Sigstore's public log for one. */
  it("verifies a KMS signature with the transparency-log check skipped", () => {
    expect(imageTrustArguments({ key: "awskms:///alias/a" }, "verify")).toEqual([
      "--key",
      "awskms:///alias/a",
      "--insecure-ignore-tlog=true",
    ]);
  });

  /** A private Sigstore: the log entry is checked against the trusted root named. */
  it("verifies a KMS signature against a private Sigstore's trusted root", () => {
    expect(
      imageTrustArguments({ key: "hashivault://k", trustedRoot: "trusted_root.json" }, "verify"),
    ).toEqual(["--key", "hashivault://k", "--trusted-root", "trusted_root.json"]);
  });

  it("pins the keyless issuer, signer, repository and the caller's main", () => {
    expect(imageTrustArguments({ sourceRepository: "acme/app" }, "verify")).toEqual([
      "--certificate-identity-regexp",
      IMAGE_SUPPLY_CHAIN_SETTINGS.signerIdentity,
      "--certificate-oidc-issuer",
      "https://token.actions.githubusercontent.com",
      "--certificate-github-workflow-repository",
      "acme/app",
      "--certificate-github-workflow-ref",
      "refs/heads/main",
    ]);
  });

  it("pins the caller ref and the trusted root a verifier names", () => {
    const args = imageTrustArguments(
      { sourceRepository: "acme/app", callerRef: "refs/tags/v1.2.0", trustedRoot: "root.json" },
      "verify",
    );

    expect(args.slice(-4)).toEqual([
      "--certificate-github-workflow-ref",
      "refs/tags/v1.2.0",
      "--trusted-root",
      "root.json",
    ]);
  });

  /** A keyless signature takes its identity from the job's OIDC token: signing names only the Sigstore files. */
  it("signs keyless with no identity arguments", () => {
    expect(imageTrustArguments({ sourceRepository: "acme/app" }, "sign")).toEqual([]);
  });

  /**
   * The signer is Runway's workflow called by a commit, a release tag or Stackra's protected main, never another
   * branch of stackra-inc/stackra. Go's RE2 and JavaScript read this pattern the same way.
   */
  it.each([
    [`${SIGNER}@${"a".repeat(40)}`, true],
    [`${SIGNER}@refs/tags/runway-v3`, true],
    [`${SIGNER}@refs/heads/main`, true],
    [`${SIGNER}@refs/heads/feature`, false],
    [`${SIGNER}@refs/tags/v1`, false],
    [`${SIGNER}@${"a".repeat(39)}`, false],
    [`${SIGNER}@${"a".repeat(40)}x`, false],
    [`https://github.com/acme/app/.github/workflows/runway-image.yml@${"a".repeat(40)}`, false],
  ])("the default signer identity takes %s: %s", (san, accepted) => {
    expect(new RegExp(IMAGE_SUPPLY_CHAIN_SETTINGS.signerIdentity).test(san)).toBe(accepted);
  });

  it.each([
    ["a key file", { key: "cosign.key" }],
    ["a key with a space", { key: "awskms:///alias/a --insecure" }],
    ["keyless with no repository", {}],
    ["keyless with a bad repository", { sourceRepository: "acme" }],
    ["a short caller ref", { sourceRepository: "acme/app", callerRef: "main" }],
    ["a caller ref with a space", { sourceRepository: "acme/app", callerRef: "refs/heads/a b" }],
    ["a trusted root read as a flag", { key: "hashivault://k", trustedRoot: "--insecure" }],
    ["an empty signing config", { key: "hashivault://k", signingConfig: "" }],
  ])("refuses %s", (_name, trust) => {
    expect(() => imageTrustArguments(trust, "verify")).toThrow(RunwayUnresolvedError);
    expect(() => imageTrustArguments(trust, "sign")).toThrow(RunwayUnresolvedError);
  });
});
