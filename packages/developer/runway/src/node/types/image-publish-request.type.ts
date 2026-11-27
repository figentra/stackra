/**
 * Stackra file contract:
 * Purpose: `ImagePublishRequest`, what `publishImage` needs to build, scan, push, describe, sign and check one deploy
 *          image of the product's generated Encore app, with its trust root (`ImageTrust`).
 * Boundary: type only; no credential: the registry login, the OIDC token or the KMS role are the job's own.
 * Runtime: node
 * Governing contract: ADR 0174 (decisions 1 and 2); ADR 0168 (decision 2); STA-609.
 */
import type { CommandRunner } from "#node/types/command-runner.type";
import type { ImageTrust } from "#node/types/image-trust.type";

/**
 * What one run of the image step builds, gates, signs and verifies. The trust root: a KMS key (`key`) for an
 * air-gapped signer, signed with no transparency log unless `signingConfig` names a private Sigstore; otherwise
 * keyless (Sigstore), the verify after signing pinning `sourceRepository` and `callerRef` (default main).
 */
export type ImagePublishRequest = Omit<ImageTrust, "identity"> & {
  /** The repository root, with the product built and `stackra gen` run. */
  readonly repository: string;
  /** The full source commit the image is built from; it is also the image tag. */
  readonly sha: string;
  /** The image repository, registry host and path, without a tag or digest (`123.dkr.ecr.me-central-1.amazonaws.com/acme-core`). */
  readonly image: string;
  /** The base image, pinned by digest (`node:24-slim@sha256:…`). */
  readonly base: string;
  /** The target architecture (default `amd64`). */
  readonly arch?: "amd64" | "arm64" | undefined;
  /** The folder the SBOM and the record are written to. */
  readonly out: string;
  /** Runs git, encore, trivy, docker, syft and cosign. */
  readonly run: CommandRunner;
};
