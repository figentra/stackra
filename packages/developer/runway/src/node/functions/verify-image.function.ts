/**
 * Stackra file contract:
 * Purpose: `verifyImage(request)`, the check a deploy runs before it uses an image and the last step of `publishImage`:
 *          `cosign verify` of the image's signature and `cosign verify-attestation` of its CycloneDX SBOM, both against
 *          the reference by digest and one trust root: the KMS key that signed it, or the keyless signer (Runway's
 *          `runway-image.yml` on GitHub's OIDC issuer) for the caller repository named.
 * Boundary: runs `cosign` through the given runner and reads nothing else; a reference without a digest, a key that is
 *           not a KMS reference, or a keyless check with no repository to pin is refused before cosign runs. Never
 *           pulls or runs the image.
 * Runtime: node
 * Governing contract: ADR 0174 (decision 2 and its enforcement: cosign verification at deploy); STA-609.
 */
import { RunwayImageRejectedError } from "#core/errors/runway-image-rejected.error";
import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { IMAGE_SUPPLY_CHAIN_SETTINGS } from "#node/constants/image-supply-chain-settings.constant";
import { imageTrustArguments } from "#node/functions/image-trust-arguments.function";
import type { ImageVerifyRequest } from "#node/types/image-verify-request.type";

/**
 * Verifies the image's signature and its SBOM attestation.
 *
 * @param request - the reference by digest, the trust root and the runner.
 * @throws RunwayUnresolvedError when the reference has no digest or the trust root is not usable.
 * @throws RunwayImageRejectedError when cosign finds no valid signature or SBOM attestation.
 * @example
 * await verifyImage({ reference: "r.example/acme-core@sha256:…", sourceRepository: "acme/app", run: runProgram });
 */
export async function verifyImage(request: ImageVerifyRequest): Promise<void> {
  const { reference, run } = request;
  if (!IMAGE_SUPPLY_CHAIN_SETTINGS.referencePattern.test(reference))
    throw new RunwayUnresolvedError(
      `${reference} is not pinned by digest: verify and deploy <registry>/<repository>@sha256:<digest>, never a tag`,
    );
  const trust = imageTrustArguments(request.key, request.sourceRepository, request.identity);
  const check = async (args: readonly string[]): Promise<void> => {
    try {
      await run("cosign", [...args, ...trust, reference], {});
    } catch (error) {
      throw new RunwayImageRejectedError("verify", reference, (error as Error).message);
    }
  };
  await check(["verify"]);
  await check(["verify-attestation", "--type", IMAGE_SUPPLY_CHAIN_SETTINGS.attestationType]);
}
