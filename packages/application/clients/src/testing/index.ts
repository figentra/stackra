/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./testing` entry of @stackra/clients (`fakeClient` with its `ClientFake` and
 *          `FakeAnswer`, `fakeClientError` with its options, and the memory `ClientTransport`: the testing plugin and
 *          `memoryTransport`) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing; test code only. Importing it registers the testing plugin.
 * Runtime: node (vitest)
 * Governing contract: ADR 0294 (decision 15); ADR 0269 (testing entries); the STA-347 stand-in barrel decision.
 */
export { ClientFake } from "#testing/client.fake";
export { CLIENTS_TESTING_PLUGIN } from "#testing/constants/clients-testing-plugin.constant";
export { fakeClient } from "#testing/functions/fake-client.function";
export { fakeClientError } from "#testing/functions/fake-client-error.function";
export { memoryTransport } from "#testing/functions/memory-transport.function";
export type { FakeAnswer } from "#testing/types/fake-answer.type";
export type { FakeClientErrorOptions } from "#testing/types/fake-client-error-options.type";
