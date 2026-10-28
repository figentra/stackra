/**
 * Stackra file contract:
 * Purpose: `buildPostgresTestImage`, which builds the integration-tier Postgres image (`POSTGRES_TEST_IMAGE`) once per
 *          test process and answers its tag, so `usePostgres()` runs a Postgres with every approved extension.
 * Boundary: internal to `./testing`. Writes the Dockerfile to a fresh temporary folder (the package runs from `src` or
 *           `dist`, so it never relies on a file beside the module) and builds it with Testcontainers, kept after the
 *           run so Docker's layer cache makes later builds instant. Needs Docker, which only the integration task
 *           provides. A failed build is not cached, so the next file tries again.
 * Runtime: node
 * Governing contract: ADR 0182 (the integration tier); ADR 0269 (decision 3); ADR 0160; ADR 0314; gap db19
 *                     (stackra-284).
 */
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { GenericContainer } from "testcontainers";

import { POSTGRES_TEST_IMAGE } from "#testing/constants/postgres-test-image.constant";

/** The build of this process, shared by every `usePostgres()` call. */
let built: Promise<string> | undefined;

/**
 * The tag of the built integration-tier image.
 *
 * @throws the Docker build's error when the image cannot be built.
 * @example
 * const container = await new PostgreSqlContainer(await buildPostgresTestImage()).start();
 */
export function buildPostgresTestImage(): Promise<string> {
  built ??= (async () => {
    const context = mkdtempSync(join(tmpdir(), "stackra-postgres-test-"));
    writeFileSync(join(context, "Dockerfile"), POSTGRES_TEST_IMAGE.dockerfile);
    await GenericContainer.fromDockerfile(context).build(POSTGRES_TEST_IMAGE.tag, {
      deleteOnExit: false,
    });
    return POSTGRES_TEST_IMAGE.tag;
  })().catch((error: unknown) => {
    built = undefined;
    throw error;
  });
  return built;
}
