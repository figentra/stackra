/**
 * Stackra file contract:
 * Purpose: unit tests of `checkProvenance`: a matching bundle passes with its predicate type; a missing bundle, a
 *          foreign subject, a foreign workflow identity and a malformed bundle are refused.
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

describe("checkProvenance", () => {
  it("passes the trusted publisher's bundle for this tarball", () => {
    expect(
      checkProvenance(sigstoreBundle("abc", identityOf("figentra/stackra")), "abc", PUBLISHER),
    ).toEqual({
      ok: true,
      predicateType: "https://slsa.dev/provenance/v1",
    });
  });

  it.each([
    [null, "provenance bundle is missing"],
    ["{", "provenance bundle is not a Sigstore DSSE bundle"],
    [
      sigstoreBundle("other", identityOf("figentra/stackra")),
      "provenance subject is not this tarball",
    ],
    [sigstoreBundle("abc", identityOf("someone/else")), "provenance was not signed by"],
  ])("refuses %#", (bundle, reason) => {
    const verdict = checkProvenance(bundle, "abc", PUBLISHER);
    expect(verdict.ok).toBe(false);
    if (!verdict.ok) expect(verdict.reason).toContain(reason);
  });
});
