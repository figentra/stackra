/**
 * Stackra file contract:
 * Purpose: `RunwayImageRejectedError`, thrown when a deploy image fails one step of Runway's image supply chain: the
 *          build, the Trivy gate (a critical vulnerability with a released fix), the push, the SBOM, the signature, the
 *          attestation or the cosign verify a deploy runs before it uses an image.
 * Boundary: a plain `Error` naming the step, the image and the tool's own reason; never a credential (cosign, docker and
 *           the registry read their own login, and no secret is ever an argument).
 * Runtime: isomorphic
 * Governing contract: ADR 0174 (decisions 1 and 2, and its enforcement: Trivy in the release job, cosign verification
 *                     at deploy); STA-609.
 */
import type { ImageStep } from "#core/types/image-step.type";

/**
 * A deploy image Runway refuses to ship or to deploy.
 *
 * @example
 * try {
 *   await verifyImage({ reference, sourceRepository: "acme/app", run: runProgram });
 * } catch (error) {
 *   if (error instanceof RunwayImageRejectedError) error.step; // "verify"
 * }
 */
export class RunwayImageRejectedError extends Error {
  /** The step that refused the image. */
  readonly step: ImageStep;

  /** The image (a tag before the push, a reference by digest after it). */
  readonly image: string;

  /**
   * @param step - the step that refused it.
   * @param image - the image tag or reference.
   * @param reason - why, in the tool's words or Runway's.
   */
  constructor(step: ImageStep, image: string, reason: string) {
    super(`${image}: the ${step} step refused the image: ${reason}`);
    this.name = "RunwayImageRejectedError";
    this.step = step;
    this.image = image;
  }
}
