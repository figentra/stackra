/**
 * Stackra file contract:
 * Purpose: unit tests of `checkProvenance`: a bundle whose subject matches by SHA-512 (as npm writes it) or SHA-256
 *          passes with its predicate type; a missing bundle, a foreign subject, a foreign workflow identity and a
 *          malformed bundle are refused.
 * Boundary: pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0453 (decision 9).
 */
import { identityOf, sigstoreBundle } from "#src/__tests__/fixtures/registry.fixture";
import type { PublisherRow } from "#src/interfaces/publisher-row.interface";
import { checkProvenance } from "#src/publish/check-provenance";

const PUBLISHER: PublisherRow = {
  scope: "@stackra",
  repository: "figentra/stackra",
  repository_id: "1425140001",
  repository_owner_id: "314302700",
  workflow: ".github/workflows/release.yml",
  ref: "refs/heads/main",
  environment: "release",
};

const DIGESTS = { sha256: "a256", sha512: "a512" };

describe("checkProvenance", () => {
  it.each([
    ["npm's sha512 subject", { sha512: "a512" }],
    ["a sha256 subject", { sha256: "a256" }],
  ])("passes the trusted publisher's bundle for this tarball by %s", (_, digest) => {
    expect(
      checkProvenance(sigstoreBundle(digest, identityOf("figentra/stackra")), DIGESTS, PUBLISHER),
    ).toEqual({
      ok: true,
      predicateType: "https://slsa.dev/provenance/v1",
    });
  });

  it.each([
    [null, "provenance bundle is missing"],
    ["{", "provenance bundle is not a Sigstore DSSE bundle"],
    [
      sigstoreBundle({ sha512: "other" }, identityOf("figentra/stackra")),
      "provenance subject is not this tarball",
    ],
    [
      sigstoreBundle({ sha512: "a512" }, identityOf("someone/else")),
      "provenance was not signed by",
    ],
  ])("refuses %#", (bundle, reason) => {
    const verdict = checkProvenance(bundle, DIGESTS, PUBLISHER);
    expect(verdict.ok).toBe(false);
    if (!verdict.ok) expect(verdict.reason).toContain(reason);
  });
});
