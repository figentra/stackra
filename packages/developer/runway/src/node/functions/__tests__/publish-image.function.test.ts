/**
 * Stackra file contract:
 * Purpose: unit tests of `publishImage`: the image is built by `encore build docker` from the deploy commit's tree
 *          (generated app at the root, no `.git` link, the installed `node_modules` linked in), with the pinned base and no infra
 *          config; Trivy gates it before the push; the digest the registry answered is what syft describes, cosign
 *          signs and attests and the verify checks (pinning the caller's main); the record names it; the checkout is
 *          removed; each architecture gets its own `<sha>-<arch>` tag. A failed scan pushes nothing, a missing digest signs nothing, a KMS key signs with the key and the
 *          offline signing config (no transparency log) unless a private Sigstore is named and verifies with the log
 *          check skipped, and bad inputs stop before the build.
 * Boundary: test only; a temporary git repository with the real `git` (`runProgram`) and a recording fake for encore,
 *           trivy, docker, syft and cosign, so no image is built, pushed or signed.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0174 (decisions 1 and 2); ADR 0168 (decision 2); STA-609.
 */
import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { RunwayImageRejectedError } from "#core/errors/runway-image-rejected.error";
import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { IMAGE_SUPPLY_CHAIN_SETTINGS } from "#node/constants/image-supply-chain-settings.constant";
import { publishImage } from "#node/functions/publish-image.function";
import { runProgram } from "#node/functions/run-program.function";
import type { CommandRunner } from "#node/types/command-runner.type";
import type { ImagePublishRequest } from "#node/types/image-publish-request.type";

let repository: string;
let out: string;
let sha: string;

const IMAGE = "registry.example.com/acme/acme-core";
const DIGEST = `sha256:${"a".repeat(64)}`;
const BASE = `node:24-slim@sha256:${"b".repeat(64)}`;

/** Writes `content` at `path` under the repository, creating its folders. */
function write(path: string, content: string): void {
  const file = join(repository, path);
  mkdirSync(join(file, ".."), { recursive: true });
  writeFileSync(file, content);
}

/** One recorded tool call (git calls run for real and are not recorded). */
type Call = { command: string; args: readonly string[]; cwd?: string | undefined };

/**
 * A runner that runs git for real and records every other tool. `fail` names a tool call to fail (`trivy`, `docker
 * push`, …); `digests` is what `docker image inspect` answers.
 */
function fake(options: { fail?: string; digests?: readonly string[] } = {}) {
  const calls: Call[] = [];
  const seen: {
    app?: boolean;
    git?: boolean;
    rootModules?: boolean;
    memberModules?: boolean;
    signingConfig?: unknown;
  } = {};
  const run: CommandRunner = async (command, args, opts) => {
    if (command === "git") return runProgram(command, args, opts);
    calls.push({ command, args, cwd: opts.cwd });
    if (command === "encore" && opts.cwd !== undefined) {
      seen.app = existsSync(join(opts.cwd, "encore.app"));
      seen.git = existsSync(join(opts.cwd, ".git"));
      seen.rootModules = lstatSync(join(opts.cwd, "node_modules")).isSymbolicLink();
      seen.memberModules = lstatSync(join(opts.cwd, "services/core/node_modules")).isSymbolicLink();
    }
    const config = args.indexOf("--signing-config");
    if (command === "cosign" && args[0] === "sign" && config !== -1) {
      const file = args[config + 1] as string;
      seen.signingConfig = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : "missing";
    }
    const name = `${command} ${args[0] ?? ""}`;
    if (options.fail !== undefined && (name === options.fail || command === options.fail))
      // As `runProgram` throws: the tool's standard output stays on the cause.
      throw new Error(`${name} failed: refused`, {
        cause: { stdout: command === "trivy" ? "CVE-2026-0001 openssl 3.0.1 -> 3.0.2\n" : "" },
      });
    if (command === "docker" && args[0] === "image")
      return JSON.stringify(options.digests ?? [`other.example/x@${DIGEST}`, `${IMAGE}@${DIGEST}`]);
    return "";
  };
  return { run, calls, seen };
}

/** A request for the test repository. */
const request = (
  run: CommandRunner,
  extra: Partial<ImagePublishRequest> = {},
): ImagePublishRequest => ({
  repository,
  sha,
  image: IMAGE,
  base: BASE,
  sourceRepository: "acme/app",
  out,
  run,
  ...extra,
});

/** Runs git in the test repository. */
const git = (...args: string[]): Promise<string> => runProgram("git", args, { cwd: repository });

beforeEach(async () => {
  repository = mkdtempSync(join(tmpdir(), "stackra-image-"));
  out = join(repository, "dist/images");
  write(".gitignore", ".stackra/\ndist/\nnode_modules/\nservices/*/encore.app\nstackra-encore/\n");
  write("package.json", JSON.stringify({ name: "acme", private: true }));
  write("services/core/package.json", JSON.stringify({ name: "@acme/core-service", imports: {} }));
  write("services/core/src/index.ts", "export const core = 1;\n");
  await git("init", "--quiet", "--initial-branch=main");
  await git("add", "--all");
  await git(
    "-c",
    "user.name=t",
    "-c",
    "user.email=t@t.invalid",
    "commit",
    "--quiet",
    "-m",
    "source",
  );
  sha = (await git("rev-parse", "HEAD")).trim();
  // What gen and the install leave behind, gitignored.
  write("services/core/encore.app", '{ "id": "acme-x1", "lang": "typescript" }\n');
  write("services/core/stackra-encore/core/api.ts", "export const api = 1;\n");
  write("node_modules/encore.dev/package.json", "{}");
  write("services/core/node_modules/encore.dev/package.json", "{}");
});

afterEach(() => rmSync(repository, { recursive: true, force: true }));

describe("publishImage", () => {
  /** The whole chain, in order, on the digest the registry answered. */
  it("builds from the deploy tree, scans, pushes, then describes, signs, attests and verifies the digest", async () => {
    const { run, calls, seen } = fake();
    const publication = await publishImage(request(run));
    const tag = `${IMAGE}:${sha}-amd64`;
    const reference = `${IMAGE}@${DIGEST}`;
    const sbom = join(out, "sbom-acme-core.cdx.json");
    const identity = [
      "--certificate-identity-regexp",
      IMAGE_SUPPLY_CHAIN_SETTINGS.signerIdentity,
      "--certificate-oidc-issuer",
      "https://token.actions.githubusercontent.com",
      "--certificate-github-workflow-repository",
      "acme/app",
      "--certificate-github-workflow-ref",
      "refs/heads/main",
    ];

    expect(calls.map(({ command, args }) => [command, ...args])).toEqual([
      ["encore", "build", "docker", "--skip-config", "--base", BASE, "--arch", "amd64", tag],
      [
        "trivy",
        "image",
        "--scanners",
        "vuln",
        "--severity",
        "CRITICAL",
        "--ignore-unfixed",
        "--exit-code",
        "1",
        "--no-progress",
        "--quiet",
        "--skip-version-check",
        tag,
      ],
      ["docker", "push", tag],
      ["docker", "image", "inspect", "--format", "{{json .RepoDigests}}", tag],
      ["syft", "scan", `docker:${tag}`, "--output", `cyclonedx-json=${sbom}`],
      ["cosign", "sign", "--yes", reference],
      ["cosign", "attest", "--yes", "--type", "cyclonedx", "--predicate", sbom, reference],
      ["cosign", "verify", ...identity, reference],
      ["cosign", "verify-attestation", "--type", "cyclonedx", ...identity, reference],
    ]);
    // Built in the deploy tree, not the working tree: the generated app at the root, the installed packages linked.
    expect(calls[0]?.cwd).not.toBe(repository);
    // Unlinked from git: inside a worktree Encore's build walks the repository and never finishes.
    expect(seen).toEqual({ app: true, git: false, rootModules: true, memberModules: true });
    expect((await git("worktree", "list")).trim().split("\n")).toHaveLength(1);

    expect(publication).toEqual({
      schema: "runway.image/v1",
      image: IMAGE,
      tag: `${sha}-amd64`,
      digest: DIGEST,
      reference,
      sourceSha: sha,
      deployCommit: expect.stringMatching(/^[0-9a-f]{40}$/),
      base: BASE,
      arch: "amd64",
      sbom: "sbom-acme-core.cdx.json",
      signing: "keyless",
    });
    expect(publication.deployCommit).not.toBe(sha);
    expect(JSON.parse(readFileSync(join(out, "runway-image-acme-core.json"), "utf8"))).toEqual(
      publication,
    );
  });

  /** A critical, fixable finding stops the image before it leaves the job. */
  it("pushes and signs nothing when the Trivy gate fails", async () => {
    const { run, calls } = fake({ fail: "trivy" });
    const failed = publishImage(request(run));

    await expect(failed).rejects.toThrow(RunwayImageRejectedError);
    await expect(failed).rejects.toMatchObject({ step: "scan", image: `${IMAGE}:${sha}-amd64` });
    // The refusal names the finding Trivy printed.
    await expect(failed).rejects.toThrow(/CVE-2026-0001 openssl 3\.0\.1 -> 3\.0\.2/);
    expect(calls.map(({ command }) => command)).toEqual(["encore", "trivy"]);
    expect(existsSync(join(out, "runway-image-acme-core.json"))).toBe(false);
  });

  /** Without the registry's digest there is nothing to sign: a tag can move. */
  it("signs nothing when the registry answered no digest for the image", async () => {
    const { run, calls } = fake({ digests: [`other.example/x@${DIGEST}`] });

    await expect(publishImage(request(run))).rejects.toMatchObject({ step: "push" });
    expect(calls.some(({ command }) => command === "syft" || command === "cosign")).toBe(false);
  });

  /** A failed verify after signing is a refusal, and no record is written. */
  it("writes no record when the verify fails", async () => {
    const { run } = fake({ fail: "cosign verify" });

    await expect(publishImage(request(run))).rejects.toMatchObject({ step: "verify" });
    expect(existsSync(join(out, "runway-image-acme-core.json"))).toBe(false);
  });

  /**
   * The air-gapped signer: the KMS key signs and attests with a signing config that names no transparency log or
   * timestamp authority (so no Sigstore service is reached and the digest never reaches the public log), and the verify
   * skips the log check to match; no keyless identity is asked for. The config is removed afterwards.
   */
  /** Two architectures of one commit push two tags: an arm64 run never moves the amd64 tag. */
  it("tags each architecture apart, so a second architecture never overwrites the first", async () => {
    const pushed: string[] = [];
    for (const arch of ["amd64", "arm64"] as const) {
      const { run, calls } = fake();
      const publication = await publishImage(request(run, { arch }));
      pushed.push(
        ...calls
          .filter(({ command, args }) => command === "docker" && args[0] === "push")
          .map(({ args }) => args[1] as string),
      );
      expect(publication.tag).toBe(`${sha}-${arch}`);
    }
    expect(pushed).toEqual([`${IMAGE}:${sha}-amd64`, `${IMAGE}:${sha}-arm64`]);
  });

  it("signs, attests and verifies with a KMS key and no transparency log", async () => {
    const { run, calls, seen } = fake();
    const key = "awskms:///alias/acme-images";
    const publication = await publishImage(
      request(run, { key, sourceRepository: undefined, arch: "arm64" }),
    );
    const cosign = calls.filter(({ command }) => command === "cosign").map(({ args }) => args);
    const config = cosign[0]?.[cosign[0].indexOf("--signing-config") + 1] as string;
    const reference = `${IMAGE}@${DIGEST}`;
    const sbom = join(out, "sbom-acme-core.cdx.json");

    expect(publication.signing).toBe("kms");
    expect(publication.arch).toBe("arm64");
    expect(calls[0]?.args).toContain("arm64");
    expect(cosign).toEqual([
      ["sign", "--yes", "--key", key, "--signing-config", config, reference],
      [
        "attest",
        "--yes",
        "--key",
        key,
        "--signing-config",
        config,
        "--type",
        "cyclonedx",
        "--predicate",
        sbom,
        reference,
      ],
      ["verify", "--key", key, "--insecure-ignore-tlog=true", reference],
      [
        "verify-attestation",
        "--type",
        "cyclonedx",
        "--key",
        key,
        "--insecure-ignore-tlog=true",
        reference,
      ],
    ]);
    expect(seen.signingConfig).toEqual({
      mediaType: "application/vnd.dev.sigstore.signingconfig.v0.2+json",
      rekorTlogConfig: {},
      tsaConfig: {},
    });
    expect(config.startsWith(out)).toBe(false);
    expect(existsSync(config)).toBe(false);
  });

  /** A private Sigstore: its signing config signs, its trusted root checks the log entry, nothing is written. */
  it("signs and verifies with a KMS key against a private Sigstore", async () => {
    const { run, calls } = fake();
    const key = "hashivault://acme-images";
    await publishImage(
      request(run, {
        key,
        sourceRepository: undefined,
        signingConfig: "/etc/sigstore/signing_config.json",
        trustedRoot: "/etc/sigstore/trusted_root.json",
      }),
    );
    const cosign = calls.filter(({ command }) => command === "cosign").map(({ args }) => args);
    const trust = ["--trusted-root", "/etc/sigstore/trusted_root.json"];

    expect(cosign[0]).toEqual([
      "sign",
      "--yes",
      "--key",
      key,
      "--signing-config",
      "/etc/sigstore/signing_config.json",
      ...trust,
      `${IMAGE}@${DIGEST}`,
    ]);
    expect(cosign[2]).toEqual(["verify", "--key", key, ...trust, `${IMAGE}@${DIGEST}`]);
    expect(cosign.flat()).not.toContain("--insecure-ignore-tlog=true");
  });

  /** The verify after signing pins the caller ref the job runs on when it is not main. */
  it("pins the caller ref given in the verify after a keyless signature", async () => {
    const { run, calls } = fake();
    await publishImage(request(run, { callerRef: "refs/tags/v2.0.0" }));
    const verify = calls.find(({ command, args }) => command === "cosign" && args[0] === "verify");

    expect(verify?.args.join(" ")).toContain("--certificate-github-workflow-ref refs/tags/v2.0.0");
    expect(calls.find(({ args }) => args[0] === "sign")?.args).toEqual([
      "sign",
      "--yes",
      `${IMAGE}@${DIGEST}`,
    ]);
  });

  /** Every input is checked before anything is built. */
  it.each([
    ["a tagged image", { image: `${IMAGE}:latest` }],
    ["an upper-case image", { image: "registry.example.com/Acme" }],
    ["an image with no registry", { image: "acme-core" }],
    ["a base not pinned by digest", { base: "node:24-slim" }],
    ["a short commit", { sha: "abc1234" }],
    ["a key file", { key: "cosign.key" }],
    ["keyless with no repository", { sourceRepository: undefined }],
    ["a caller ref that is not a full ref", { callerRef: "main" }],
    ["a trusted root read as a flag", { trustedRoot: "--insecure-ignore-tlog" }],
    ["a signing config read as a flag", { key: "hashivault://k", signingConfig: "-x" }],
  ])("refuses %s before the build", async (_name, extra: Partial<ImagePublishRequest>) => {
    const { run, calls } = fake();

    await expect(publishImage(request(run, extra))).rejects.toThrow(RunwayUnresolvedError);
    expect(calls).toEqual([]);
  });

  /** No generated app, no image. */
  it("refuses a repository with no generated Encore app", async () => {
    rmSync(join(repository, "services/core/encore.app"));
    const { run, calls } = fake();

    await expect(publishImage(request(run))).rejects.toThrow(/run stackra gen/);
    expect(calls).toEqual([]);
  });
});
