/**
 * Stackra file contract:
 * Purpose: `publishImage(request)`, Runway's image step for a self-hosted deploy (AWS ECS, Compose, on-prem): builds
 *          the product's generated Encore app as one image with `encore build docker` from its deploy commit
 *          (`encoreDeployTree`, the same tree Encore Cloud builds, unlinked from git), scans it with Trivy before anything leaves the job,
 *          pushes it, reads the digest the registry answered, writes a syft CycloneDX SBOM, signs the digest with cosign
 *          (keyless with the job's GitHub OIDC identity, or a KMS key), attests the SBOM to it, verifies both
 *          (`verifyImage`) and writes the record a deploy pins (`runway-image-<name>.json`).
 * Boundary: runs git, encore, trivy, docker, syft and cosign through the given runner, each with its own login (the
 *           registry login, GitHub OIDC, the KMS role); no credential is an argument or written. Writes only the SBOM
 *           and the record under `out`, and the temporary checkout `encoreDeployTree` removes. Every input is checked
 *           before the build: a tagged or upper-case image, a base not pinned by digest, a key file. A failed scan
 *           pushes nothing.
 * Runtime: node
 * Governing contract: ADR 0174 (decisions 1 and 2: syft SBOM, cosign signature and attestations, Trivy fails on a
 *                     fixable critical finding, KMS key for air-gapped installs); ADR 0168 (decision 2: `encore build
 *                     docker` only in deploy and release jobs); ADR 0091 (decision 2: the generated Encore app); STA-609.
 */
import { existsSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

import { RunwayImageRejectedError } from "#core/errors/runway-image-rejected.error";
import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import type { ImageStep } from "#core/types/image-step.type";
import { IMAGE_SUPPLY_CHAIN_SETTINGS } from "#node/constants/image-supply-chain-settings.constant";
import { encoreDeployTree } from "#node/functions/encore-deploy-tree.function";
import { imageTrustArguments } from "#node/functions/image-trust-arguments.function";
import { verifyImage } from "#node/functions/verify-image.function";
import { workspacePackages } from "#node/functions/workspace-packages.function";
import type { ImagePublication } from "#node/types/image-publication.type";
import type { ImagePublishRequest } from "#node/types/image-publish-request.type";

/** A full git commit id. */
const COMMIT = /^[0-9a-f]{40}$/;

/**
 * Links the repository's installed `node_modules` folders into the deploy tree (which carries none), so
 * `encore build docker` resolves the app's packages as the installed workspace does.
 */
function linkModules(repository: string, tree: string, members: readonly string[]): void {
  const folders = [
    ".",
    ...members,
    ...[...workspacePackages(repository).values()].map((pkg) => relative(repository, pkg.dir)),
  ];
  for (const folder of new Set(folders)) {
    const from = join(repository, folder, "node_modules");
    const to = join(tree, folder, "node_modules");
    if (existsSync(from) && existsSync(join(tree, folder)) && !existsSync(to))
      symlinkSync(from, to, "dir");
  }
}

/**
 * Runs one step, turning a tool's failure into the step's refusal. The reason carries what the tool printed on
 * standard output as well (Trivy's findings table), never an argument.
 */
async function step<T>(name: ImageStep, image: string, work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (error) {
    if (error instanceof RunwayImageRejectedError) throw error;
    const printed = ((error as Error).cause as { stdout?: unknown } | undefined)?.stdout;
    const detail =
      typeof printed === "string" && printed.trim() !== "" ? `\n${printed.trim()}` : "";
    throw new RunwayImageRejectedError(name, image, `${(error as Error).message}${detail}`);
  }
}

/**
 * Builds, scans, pushes, describes, signs and verifies the product's deploy image.
 *
 * @param request - the repository, the commit, the image repository, the base, the trust root and the runner.
 * @returns the record written to `out`.
 * @throws RunwayUnresolvedError when an input is not usable or the repository has no generated Encore app.
 * @throws RunwayImageRejectedError when a step fails: the build, the scan (nothing pushed), the push, the SBOM, the
 *         signature, the attestation or the verify.
 * @example
 * const image = await publishImage({
 *   repository: ".", sha, image: "123.dkr.ecr.me-central-1.amazonaws.com/acme-core",
 *   base: "node:24-slim@sha256:…", sourceRepository: "acme/app", out: "dist/images", run: runProgram,
 * });
 * image.reference; // "123.dkr.ecr.me-central-1.amazonaws.com/acme-core@sha256:…"
 */
export async function publishImage(request: ImagePublishRequest): Promise<ImagePublication> {
  const { repository, sha, image, base, key, sourceRepository, out, run } = request;
  const arch = request.arch ?? "amd64";
  const settings = IMAGE_SUPPLY_CHAIN_SETTINGS;
  if (!COMMIT.test(sha))
    throw new RunwayUnresolvedError(`${sha} is not a full commit id: pass the 40-character SHA`);
  if (!settings.imagePattern.test(image))
    throw new RunwayUnresolvedError(
      `${image} is not an image repository: pass <registry>/<path> in lower case, with no tag or digest`,
    );
  if (!settings.basePattern.test(base))
    throw new RunwayUnresolvedError(
      `${base} is not pinned by digest: pass the base image as <name>@sha256:<digest>`,
    );
  // Checked before the build, so a wrong trust root never leaves a pushed, unsigned image behind.
  const signer = key === undefined ? [] : imageTrustArguments(key, undefined);
  if (key === undefined) imageTrustArguments(undefined, sourceRepository);

  const tree = await encoreDeployTree({ repository, sha, run });
  if (tree === undefined)
    throw new RunwayUnresolvedError(
      "no generated Encore app under services/: run stackra gen before the image step",
    );
  const tag = `${image}:${sha}`;
  try {
    // The deploy commit is already written, so the checkout needs no link back to the repository: inside a git
    // worktree `encore build docker` (1.58.8) walks the repository and never finishes. `dispose` prunes the entry.
    rmSync(join(tree.dir, ".git"), { force: true });
    linkModules(repository, tree.dir, tree.members);
    await step("build", tag, () =>
      run("encore", [...settings.buildArgs, "--base", base, "--arch", arch, tag], {
        cwd: tree.dir,
      }),
    );
  } finally {
    await tree.dispose();
  }

  await step("scan", tag, () => run("trivy", [...settings.scanArgs, tag], {}));
  await step("push", tag, () => run("docker", ["push", tag], {}));
  const reference = await step("push", tag, async () => {
    const digests = JSON.parse(
      await run("docker", ["image", "inspect", "--format", "{{json .RepoDigests}}", tag], {}),
    ) as unknown;
    const found = (Array.isArray(digests) ? digests : []).find(
      (entry): entry is string => typeof entry === "string" && entry.startsWith(`${image}@sha256:`),
    );
    if (found === undefined || !settings.referencePattern.test(found))
      throw new Error(`the registry answered no digest for ${image}`);
    return found;
  });

  const name = image.split("/").at(-1) as string;
  mkdirSync(out, { recursive: true });
  const sbom = settings.sbomFile.replace("<name>", name);
  await step("sbom", reference, () =>
    run(
      "syft",
      ["scan", `docker:${tag}`, "--output", `${settings.sbomFormat}=${join(out, sbom)}`],
      {},
    ),
  );
  await step("sign", reference, () => run("cosign", ["sign", "--yes", ...signer, reference], {}));
  await step("attest", reference, () =>
    run(
      "cosign",
      [
        "attest",
        "--yes",
        ...signer,
        "--type",
        settings.attestationType,
        "--predicate",
        join(out, sbom),
        reference,
      ],
      {},
    ),
  );
  await verifyImage({ reference, key, sourceRepository, run });

  const publication: ImagePublication = {
    schema: settings.recordSchema,
    image,
    tag: sha,
    digest: reference.slice(image.length + 1),
    reference,
    sourceSha: sha,
    deployCommit: tree.sha,
    base,
    arch,
    sbom,
    signing: key === undefined ? "keyless" : "kms",
  };
  writeFileSync(
    join(out, settings.recordFile.replace("<name>", name)),
    `${JSON.stringify(publication, null, 2)}\n`,
  );
  return publication;
}
