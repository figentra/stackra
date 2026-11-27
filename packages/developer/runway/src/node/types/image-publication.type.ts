/**
 * Stackra file contract:
 * Purpose: `ImagePublication`, the record `publishImage` writes and answers for one deploy image: the reference by
 *          digest a deploy pins, the commits it came from, its base and architecture, the SBOM file and how it was
 *          signed.
 * Boundary: type only; names and digests, never a credential or a key reference.
 * Runtime: node
 * Governing contract: ADR 0174 (decisions 1 and 2); STA-609.
 */
/** The record of one published deploy image. */
export type ImagePublication = {
  /** The record's schema id, `runway.image/v1`. */
  readonly schema: string;
  /** The image repository. */
  readonly image: string;
  /** The tag pushed, `<source commit>-<arch>`: one per architecture, so runs for two architectures never share one. */
  readonly tag: string;
  /** The manifest digest the registry answered (`sha256:…`). */
  readonly digest: string;
  /** `<image>@<digest>`: what a deploy pins and a verify checks. */
  readonly reference: string;
  /** The source commit. */
  readonly sourceSha: string;
  /** The deploy commit the image was built from (the generated app at the root, `encoreDeployTree`). */
  readonly deployCommit: string;
  /** The base image, pinned by digest. */
  readonly base: string;
  /** The target architecture. */
  readonly arch: "amd64" | "arm64";
  /** The SBOM file name, beside the record. */
  readonly sbom: string;
  /** `keyless` (Sigstore, GitHub OIDC) or `kms`. */
  readonly signing: "keyless" | "kms";
};
