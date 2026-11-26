/**
 * Stackra file contract:
 * Purpose: test fixture: `promtoolTestRules(files)`, which runs `promtool test rules` of a real Prometheus (the pinned
 *          official image, in Testcontainers) over a rule file and its unit-test file, and answers promtool's exit code
 *          and output.
 * Boundary: test only (integration tier); needs Docker. The files are copied into the container; nothing is served or
 *           scraped, and the container is removed after the run.
 * Runtime: node (vitest)
 * Governing contract: ADR 0182 (integration tier); ADR 0269 (Testcontainers in tests); ADR 0184 (decision 2: the
 *                     LGTM stack evaluates the rules).
 */
import { GenericContainer } from "testcontainers";

/** The Prometheus the rules are proven on, pinned (its busybox image carries `promtool` and a shell). */
export const PROMETHEUS_IMAGE = "prom/prometheus:v3.15.1";

/** What promtool answered. */
export interface PromtoolResult {
  readonly exitCode: number;
  readonly output: string;
}

/**
 * Copies `files` (name to content) into `/rules` of a Prometheus container and runs `promtool test rules` on `test`.
 *
 * @example
 * const result = await promtoolTestRules({ "slo-rules.yml": rules, "slo-rules.test.yml": tests }, "slo-rules.test.yml");
 * expect(result.exitCode).toBe(0);
 */
export async function promtoolTestRules(
  files: Readonly<Record<string, string>>,
  test: string,
): Promise<PromtoolResult> {
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
