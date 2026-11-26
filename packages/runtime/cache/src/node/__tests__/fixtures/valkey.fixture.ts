/**
 * Stackra file contract:
 * Purpose: `useValkey()`, the integration fixture of this package's Valkey driver: one Testcontainers Valkey
 *          (`VALKEY_TEST_IMAGE`) for the test file, started before its tests and stopped after them, its URL for the
 *          driver's secret, a plain client for the checks, and `track` so every driver's connection closes with it.
 * Boundary: test only; used by the `.int` files, which need Docker (the `test:int` task). Tests share the server, so
 *           each one uses keys of its own. The same fixture sits in every package that ships a Valkey driver (actions,
 *           cache, locking, queue, realtime): no package owns Valkey, and @stackra/testing stays free of containers.
 * Runtime: node (vitest)
 * Governing contract: ADR 0182 (decision 1 and 3: the integration tier on Testcontainers); ADR 0269 (decision 3);
 *                     ADR 0150 (the Valkey client).
 */
import { afterAll, beforeAll } from "@stackra/testing";
import Valkey from "iovalkey";
import { GenericContainer, Wait } from "testcontainers";
import type { StartedTestContainer } from "testcontainers";

/** The Valkey the drivers are proved on: the major and minor production runs. */
export const VALKEY_TEST_IMAGE = "valkey/valkey:8.1";

/** How long pulling and starting the container may take. */
const BOOT_TIMEOUT_MS = 120_000;

/** The running server of one test file. */
export interface ValkeyFixture {
  /** `redis://host:port` of the container. */
  readonly url: string;
  /** A client of its own, for seeding and checking keys. */
  readonly client: Valkey;
  /** Keeps `connection` to close after the file, and answers it. */
  readonly track: <T extends { readonly client: Valkey }>(connection: T) => T;
}

/**
 * Starts Valkey for the test file.
 *
 * @example
 * const valkey = useValkey();
 * const driver = valkey.track(new ValkeyCacheDriver(configFor(valkey.url), namespace, clock, lock, metrics));
 */
export function useValkey(): ValkeyFixture {
  const state: { container?: StartedTestContainer; client?: Valkey } = {};
  const opened: Valkey[] = [];
  beforeAll(async () => {
    state.container = await new GenericContainer(VALKEY_TEST_IMAGE)
      .withExposedPorts(6379)
      // The log line says the server listens; the port check says the host's mapping reaches it, so no client's first
      // connect is refused while Docker's port forwarding catches up.
      .withWaitStrategy(
        Wait.forAll([Wait.forLogMessage("Ready to accept connections"), Wait.forListeningPorts()]),
      )
      .start();
    state.client = new Valkey(
      `redis://${state.container.getHost()}:${state.container.getMappedPort(6379)}`,
    );
  }, BOOT_TIMEOUT_MS);
  afterAll(async () => {
    for (const client of opened) client.disconnect();
    state.client?.disconnect();
    await state.container?.stop();
  });
  return {
    get url(): string {
      if (state.container === undefined) throw new Error("useValkey: read url inside a test");
      return `redis://${state.container.getHost()}:${state.container.getMappedPort(6379)}`;
    },
    get client(): Valkey {
      if (state.client === undefined) throw new Error("useValkey: read client inside a test");
      return state.client;
    },
    track: (connection) => {
      opened.push(connection.client);
      return connection;
    },
  };
}
