/**
 * Stackra file contract:
 * Purpose: `RunwayImagePublishCommand`, `runway image:publish --image <registry>/<path> --base <image>@sha256:<d> --sha
 *          <sha> [--arch amd64|arm64] [--key <kms>] [--repository owner/repo] [--out dist/images]`: the image step of
 *          a self-hosted deploy (`publishImage`): build the generated Encore app, Trivy gate, push, syft SBOM, cosign
 *          signature and SBOM attestation, verify, and the record a deploy pins, given as the `--json` data.
 * Boundary: parses and prints; the work is `publishImage`'s. The keyless signer's repository defaults to the job's
 *           `GITHUB_REPOSITORY`. Prints the reference and the SBOM file, never a credential.
 * Runtime: node
 * Governing contract: ADR 0174 (decisions 1 and 2); ADR 0168 (decision 2); ADR 0506 (decision 8); STA-609.
 */
import { join } from "node:path";

import { Command, Option, UsageError, type CommandIo } from "@stackra/console";
import { Str } from "@stackra/validation";

import { publishImage } from "#node/functions/publish-image.function";
import { repositoryRoot } from "#node/functions/repository-root.function";
import { runProgram } from "#node/functions/run-program.function";
import type { ImagePublication } from "#node/types/image-publication.type";

/** Builds, gates, pushes, describes, signs and verifies the product's deploy image. */
export class RunwayImagePublishCommand extends Command({
  name: "image:publish",
  bin: true,
  description:
    "Build the generated Encore app image, scan it (Trivy), push it, write its SBOM (syft), sign and attest it (cosign) and verify it",
  examples: [
    "runway image:publish --image 123.dkr.ecr.me-central-1.amazonaws.com/acme-core --base node:24-slim@sha256:<d> --sha <sha>",
    "runway image:publish --image registry.local/acme-core --base node:24-slim@sha256:<d> --sha <sha> --key awskms:///alias/acme-images",
  ],
}) {
  /** The image repository. */
  @Option({ description: "The image repository, <registry>/<path>, with no tag or digest" })
  @Str
  image?: string;

  /** The base image, pinned by digest. */
  @Option({ description: "The base image pinned by digest (<name>@sha256:<digest>)" })
  @Str
  base?: string;

  /** The source commit. */
  @Option({ description: "The full commit SHA the image is built from (its tag)" })
  @Str
  sha?: string;

  /** The target architecture. */
  @Option({ description: "amd64 (default) or arm64" })
  @Str
  arch = "amd64";

  /** A KMS key for an air-gapped signer; keyless otherwise. */
  @Option({
    description:
      "A KMS key reference (awskms://, gcpkms://, azurekms://, hashivault://); keyless without one",
  })
  @Str
  key?: string;

  /** The repository whose job signs, for the keyless verify. */
  @Option({
    description: "owner/repo the keyless signature is checked against (default: GITHUB_REPOSITORY)",
  })
  @Str
  repository?: string;

  /** Where the SBOM and the record go. */
  @Option({ description: "The folder for the SBOM and the record (default dist/images)" })
  @Str
  out = "dist/images";

  /** The image step; a test replaces it. */
  publish: typeof publishImage = publishImage;

  /** The job's environment, for GITHUB_REPOSITORY; a test replaces it. */
  env: Readonly<Record<string, string | undefined>> = process.env;

  /**
   * Publishes the image and resolves with its record.
   *
   * @throws UsageError without `--image`, `--base` or `--sha`, or with an unknown `--arch`.
   */
  async handle(io: CommandIo): Promise<ImagePublication> {
    if (this.image === undefined)
      throw new UsageError("--image is required", "Name the image repository, <registry>/<path>");
    if (this.base === undefined)
      throw new UsageError("--base is required", "Pass the base image pinned by digest");
    if (this.sha === undefined)
      throw new UsageError("--sha is required", "Pass the full commit the image is built from");
    if (this.arch !== "amd64" && this.arch !== "arm64")
      throw new UsageError(`--arch ${this.arch} is not supported`, "Pass amd64 or arm64");
    const repository = repositoryRoot(io.cwd);
    const sourceRepository = this.repository ?? (this.env["GITHUB_REPOSITORY"] || undefined);
    const publication = await this.publish({
      repository,
      sha: this.sha,
      image: this.image,
      base: this.base,
      arch: this.arch,
      key: this.key,
      sourceRepository,
      out: this.out.startsWith("/") ? this.out : join(io.cwd, this.out),
      run: runProgram,
    });
    io.output.success(
      `${publication.reference}: scanned, signed (${publication.signing}), SBOM ${publication.sbom} attested and verified`,
    );
    return publication;
  }
}
