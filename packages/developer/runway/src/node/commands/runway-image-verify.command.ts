/**
 * Stackra file contract:
 * Purpose: `RunwayImageVerifyCommand`, `runway image:verify <image>@sha256:<digest> [--key <kms>] [--repository
 *          owner/repo] [--ref <caller ref>] [--identity <pattern>] [--trusted-root <file>]`: the check a deploy job runs
 *          before it uses an image (`verifyImage`): the cosign signature and the CycloneDX SBOM attestation, against the
 *          KMS key (air-gapped, no transparency log unless `--trusted-root` names a private Sigstore) or the keyless
 *          signer called from the caller's `--ref` (default `refs/heads/main`).
 * Boundary: parses and prints; the work is `verifyImage`'s. The keyless repository defaults to the job's
 *           `GITHUB_REPOSITORY`. Exits non-zero on a refusal, so the deploy job stops before anything ships.
 * Runtime: node
 * Governing contract: ADR 0174 (decision 2 and its enforcement: cosign verification at deploy); ADR 0506 (decision 8);
 *                     STA-609.
 */
import { Argument, Command, Option, type CommandIo } from "@stackra/console";
import { Str } from "@stackra/validation";

import { runProgram } from "#node/functions/run-program.function";
import { verifyImage } from "#node/functions/verify-image.function";

/** Verifies a deploy image's signature and SBOM attestation. */
export class RunwayImageVerifyCommand extends Command({
  name: "image:verify",
  bin: true,
  description:
    "Verify a deploy image's cosign signature and SBOM attestation before a deploy uses it",
  examples: [
    "runway image:verify 123.dkr.ecr.me-central-1.amazonaws.com/acme-core@sha256:<digest> --repository acme/app",
    "runway image:verify registry.local/acme-core@sha256:<digest> --key awskms:///alias/acme-images",
    "runway image:verify registry.local/acme-core@sha256:<digest> --repository acme/app --trusted-root trusted_root.json",
  ],
}) {
  /** The image reference by digest. */
  @Argument({ description: "The image, <registry>/<path>@sha256:<digest>" })
  reference!: string;

  /** The KMS key that signed it. */
  @Option({ description: "The KMS key reference that signed it; keyless without one" })
  @Str
  key?: string;

  /** The repository whose job signed it (keyless). */
  @Option({ description: "owner/repo whose job signed it (default: GITHUB_REPOSITORY)" })
  @Str
  repository?: string;

  /** The caller's git ref the keyless certificate must name. */
  @Option({
    description:
      "The full git ref the signing job ran on (keyless; default refs/heads/main): a signature from another ref is refused",
  })
  @Str
  ref?: string;

  /** A Sigstore trusted root file. */
  @Option({
    description:
      "A Sigstore trusted root JSON (a private Sigstore, or the public one fetched ahead for an offline verify)",
  })
  @Str
  trustedRoot?: string;

  /** The keyless signer identity pattern. */
  @Option({
    description: "The keyless signer identity pattern (default: Runway's runway-image.yml)",
  })
  @Str
  identity?: string;

  /** The verify; a test replaces it. */
  verify: typeof verifyImage = verifyImage;

  /** The job's environment, for GITHUB_REPOSITORY; a test replaces it. */
  env: Readonly<Record<string, string | undefined>> = process.env;

  /** Verifies and resolves with 0; a refusal throws. */
  async handle(io: CommandIo): Promise<number> {
    await this.verify({
      reference: this.reference,
      key: this.key,
      sourceRepository:
        this.key === undefined
          ? (this.repository ?? (this.env["GITHUB_REPOSITORY"] || undefined))
          : undefined,
      callerRef: this.key === undefined ? this.ref : undefined,
      identity: this.identity,
      trustedRoot: this.trustedRoot,
      run: runProgram,
    });
    io.output.success(`${this.reference}: signature and SBOM attestation verified`);
    return 0;
  }
}
