/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: the registry row's pipeline, header middleware, retry, timeout,
 *          stream readers, refusal and header names are exported, nothing else is (the internals and `nativeFetch`
 *          are not), and the public types resolve.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as transport from "#core/index";
import type {
  Middleware,
  RetryOptions,
  ServerSentEvent,
  TokenSource,
  Transport,
  TransportOptions,
} from "#core/index";

describe("@stackra/transport", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(transport).sort()).toEqual([
      "RequestTimedOutError",
      "TRANSPORT_HEADERS",
      "bearerToken",
      "createTransport",
      "idempotencyKey",
      "readNdjson",
      "readServerSentEvents",
      "retry",
      "stackraVersion",
      "timeout",
    ]);
    expect("nativeFetch" in transport).toBe(false);
    expect("withHeader" in transport).toBe(false);
  });

  it("resolves its public types", () => {
    expectTypeOf<Transport>().toEqualTypeOf<(request: Request) => Promise<Response>>();
    expectTypeOf<Middleware>().parameters.toEqualTypeOf<[Request, Transport]>();
    expectTypeOf<TransportOptions>().toHaveProperty("middleware");
    expectTypeOf<RetryOptions>().toHaveProperty("attempts").toEqualTypeOf<number>();
    expectTypeOf<ServerSentEvent>().toHaveProperty("data").toEqualTypeOf<string>();
    expectTypeOf<TokenSource>().returns.toEqualTypeOf<
      string | undefined | Promise<string | undefined>
    >();
  });
});
