/**
 * Stackra file contract:
 * Purpose: unit tests of `imageTrustArguments`: a KMS key of each accepted scheme gives `--key`, keyless gives the
 *          GitHub OIDC issuer, Runway's signer identity and the caller repository, and a key file, a spaced key or a
 *          keyless call with no valid repository is refused.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0174 (decision 2); STA-609.
 */
import { describe, expect, it } from "@stackra/testing";

import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { imageTrustArguments } from "#node/functions/image-trust-arguments.function";

describe("imageTrustArguments", () => {
  it.each(["awskms:///alias/a", "gcpkms://projects/p/k", "azurekms://v.vault/k", "hashivault://k"])(
    "takes the KMS key %s",
    (key) => {
      expect(imageTrustArguments(key, undefined)).toEqual(["--key", key]);
    },
  );

  it("pins the keyless issuer, signer and repository", () => {
    expect(imageTrustArguments(undefined, "acme/app")).toEqual([
      "--certificate-identity-regexp",
      "^https://github\\.com/stackra-inc/stackra/\\.github/workflows/runway-image\\.yml@",
      "--certificate-oidc-issuer",
      "https://token.actions.githubusercontent.com",
      "--certificate-github-workflow-repository",
      "acme/app",
    ]);
  });

  it.each([
    ["a key file", "cosign.key", undefined],
    ["a key with a space", "awskms:///alias/a --insecure", undefined],
    ["keyless with no repository", undefined, undefined],
    ["keyless with a bad repository", undefined, "acme"],
  ])("refuses %s", (_name, key, repository) => {
    expect(() => imageTrustArguments(key, repository)).toThrow(RunwayUnresolvedError);
  });
});
