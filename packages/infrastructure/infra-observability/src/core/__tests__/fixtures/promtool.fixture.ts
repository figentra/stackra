/**
 * Stackra file contract:
 * Purpose: test fixture: `promtoolTestRules(files)`, which runs `promtool test rules` of a real Prometheus (3.15.1: the
 *          pinned official image in Testcontainers, or the same release's `promtool` when `STACKRA_PROMETHEUS_DIR`
 *          names the unpacked release folder) over a rule file and its unit-test file, and answers promtool's exit
 *          code and output.
 * Boundary: test only (integration tier); needs Docker or the release folder. The files are written to a folder of
 *           the run (or copied into the container); nothing is served or scraped, and the folder or container is
 *           removed after the run. The binary must report the pinned version, so both modes prove the same promtool.
 * Runtime: node (vitest)
 * Governing contract: ADR 0182 (integration tier); ADR 0269 (Testcontainers in tests); ADR 0184 (decision 2: the
 *                     LGTM stack evaluates the rules).
 */
import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { GenericContainer } from "testcontainers";

/** The Prometheus release the rules are proven on. */
export const PROMETHEUS_VERSION = "3.15.1";

/** The same release as an image (its busybox image carries `promtool` and a shell), pinned. */
export const PROMETHEUS_IMAGE = `prom/prometheus:v${PROMETHEUS_VERSION}`;

/** What promtool answered. */
export interface PromtoolResult {
  readonly exitCode: number;
  readonly output: string;
}

/** Runs `bin` with `args` in `cwd`, answering its exit code and combined output (never rejecting on a failure). */
function run(bin: string, args: readonly string[], cwd?: string): Promise<PromtoolResult> {
  return new Promise((resolve) => {
    execFile(bin, args, { cwd }, (error, stdout, stderr) => {
      const code = error === null ? 0 : typeof error.code === "number" ? error.code : 1;
      resolve({ exitCode: code, output: `${stdout}${stderr}` });
    });
  });
}

/** The promtool of the release folder `dir`, checked to be the pinned version. */
export async function releasePromtool(dir: string): Promise<string> {
  const bin = join(dir, "promtool");
  const { output } = await run(bin, ["--version"]);
  if (!output.includes(`version ${PROMETHEUS_VERSION}`))
    throw new Error(`${bin} is not promtool ${PROMETHEUS_VERSION}: ${output.trim()}`);
  return bin;
}

/**
 * Writes `files` (name to content) to a rules folder and runs `promtool test rules` on `test`: the release folder
 * `STACKRA_PROMETHEUS_DIR` names, else a Prometheus container.
 *
 * @example
 * const result = await promtoolTestRules({ "slo-rules.yml": rules, "slo-rules.test.yml": tests }, "slo-rules.test.yml");
 * expect(result.exitCode).toBe(0);
 */
export async function promtoolTestRules(
  files: Readonly<Record<string, string>>,
  test: string,
): Promise<PromtoolResult> {
  const release = process.env["STACKRA_PROMETHEUS_DIR"];
  if (release !== undefined && release !== "") {
    const bin = await releasePromtool(release);
    const dir = await mkdtemp(join(tmpdir(), "stackra-promtool-"));
    try {
      for (const [name, content] of Object.entries(files))
        await writeFile(join(dir, name), content);
      return await run(bin, ["test", "rules", test], dir);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }
  const container = await new GenericContainer(PROMETHEUS_IMAGE)
    .withEntrypoint(["/bin/sh", "-c"])
    .withCommand(["sleep 600"])
    .withCopyContentToContainer(
      Object.entries(files).map(([name, content]) => ({
        content,
        target: `/rules/${name}`,
        mode: 0o644,
      })),
    )
    .start();
  try {
    const { exitCode, output } = await container.exec(
      ["promtool", "test", "rules", `/rules/${test}`],
      {
        workingDir: "/rules",
      },
    );
    return { exitCode, output };
  } finally {
    await container.stop();
  }
}
