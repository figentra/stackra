/**
 * Stackra file contract:
 * Purpose: unit tests of `RunwayImagePublishCommand` on the console: it passes the repository root, the image, the
 *          pinned base, the commit, the architecture, the key and the keyless repository (from GITHUB_REPOSITORY when
 *          `--repository` is absent) to the image step, writes under `--out` relative to the working folder, prints
 *          the reference, and refuses a missing `--image`, `--base`, `--sha` or an unknown `--arch` before the step.
 * Boundary: test only; the image step and the job's environment are replaced through their fields, so no tool runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0174; ADR 0506 (decision 8); STA-609.
 */
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { runCommandForTest } from "@stackra/console/testing";
import { describe, expect, it } from "@stackra/testing";

import { RunwayImagePublishCommand } from "#node/commands/runway-image-publish.command";
import type { ImagePublication } from "#node/types/image-publication.type";
import type { ImagePublishRequest } from "#node/types/image-publish-request.type";

const SHA = "e".repeat(40);
const BASE = `node:24-slim@sha256:${"b".repeat(64)}`;
const IMAGE = "registry.example.com/acme-core";

/** A repository root with a nested working folder. */
function repository(): { root: string; cwd: string } {
  const root = mkdtempSync(join(tmpdir(), "runway-image-"));
  writeFileSync(join(root, "pnpm-workspace.yaml"), "packages: []\n");
  mkdirSync(join(root, "apps/x"), { recursive: true });
  return { root, cwd: join(root, "apps/x") };
}

/** Runs the command with its image step recorded and `env` as the job's environment. */
async function run(argv: readonly string[], env: Record<string, string | undefined>, cwd: string) {
  const requests: Omit<ImagePublishRequest, "run">[] = [];
  class Publish extends RunwayImagePublishCommand {
    override env = env;

    override publish = async (request: ImagePublishRequest): Promise<ImagePublication> => {
      const { run: _run, ...rest } = request;
      requests.push(rest);
      return {
        schema: "runway.image/v1",
        image: request.image,
        tag: request.sha,
        digest: `sha256:${"a".repeat(64)}`,
        reference: `${request.image}@sha256:${"a".repeat(64)}`,
        sourceSha: request.sha,
        deployCommit: "f".repeat(40),
        base: request.base,
        arch: request.arch ?? "amd64",
        sbom: "sbom-acme-core.cdx.json",
        signing: request.key === undefined ? "keyless" : "kms",
      };
    };
  }
  const result = await runCommandForTest([Publish], ["image:publish", ...argv], { cwd });
  return { result, requests };
}

describe(RunwayImagePublishCommand, () => {
  it("publishes from the repository root with the job's repository as the keyless signer", async () => {
    const { root, cwd } = repository();
    const { result, requests } = await run(
      ["--image", IMAGE, "--base", BASE, "--sha", SHA, "--out", "out"],
      { GITHUB_REPOSITORY: "acme/app" },
      cwd,
    );

    expect(result.exitCode).toBe(0);
    expect(requests).toEqual([
      {
        repository: root,
        sha: SHA,
        image: IMAGE,
        base: BASE,
        arch: "amd64",
        key: undefined,
        sourceRepository: "acme/app",
        out: join(cwd, "out"),
      },
    ]);
    expect(result.stdout + result.stderr).toContain(`${IMAGE}@sha256:${"a".repeat(64)}`);
  });

  it("passes the KMS key, the architecture and an explicit repository", async () => {
    const { cwd } = repository();
    const { requests } = await run(
      [
        "--image",
        IMAGE,
        "--base",
        BASE,
        "--sha",
        SHA,
        "--arch",
        "arm64",
        "--key",
        "awskms:///alias/acme",
        "--repository",
        "acme/other",
        "--out",
        "/abs/out",
      ],
      { GITHUB_REPOSITORY: "acme/app" },
      cwd,
    );

    expect(requests[0]).toMatchObject({
      arch: "arm64",
      key: "awskms:///alias/acme",
      sourceRepository: "acme/other",
      out: "/abs/out",
    });
  });

  it.each([
    ["--image", ["--base", BASE, "--sha", SHA]],
    ["--base", ["--image", IMAGE, "--sha", SHA]],
    ["--sha", ["--image", IMAGE, "--base", BASE]],
    ["--arch", ["--image", IMAGE, "--base", BASE, "--sha", SHA, "--arch", "riscv"]],
  ])("refuses without a usable %s before the image step", async (flag, argv) => {
    const { cwd } = repository();
    const { result, requests } = await run(argv, {}, cwd);

    expect(result.exitCode).toBe(2);
    expect(result.stderr).toContain(flag);
    expect(requests).toEqual([]);
  });
});
