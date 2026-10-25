/**
 * Stackra file contract:
 * Purpose: unit tests of `idempotencyKey`: every write without a key gets one minted key (a UUID by default), reads
 *          get none, a key already set is kept, and the method is compared case-insensitively (`patch`).
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; ADR 0138.
 */
import { describe, expect, it } from "@stackra/testing";

import { createTransport } from "#core/functions/create-transport.function";
import { idempotencyKey } from "#core/functions/idempotency-key.function";

/** Sends one request through `idempotencyKey(mint)` and returns the key that reached fetch. */
async function sentKey(init: RequestInit, mint?: () => string): Promise<string | null> {
  let seen: string | null = null;
  const send = createTransport({
    middleware: [idempotencyKey(mint)],
    fetch: async (request) => {
      seen = request.headers.get("Idempotency-Key");
      return new Response(null, { status: 204 });
    },
  });
  await send(new Request("https://api.test/orders", init));
  return seen;
}

describe("idempotencyKey", () => {
  it.each(["POST", "PUT", "patch", "DELETE"])("mints a key for %s", async (method) => {
    expect(await sentKey({ method }, () => "key-1")).toBe("key-1");
  });

  it.each(["GET", "HEAD", "OPTIONS"])("adds no key to %s", async (method) => {
    expect(await sentKey({ method }, () => "key-1")).toBeNull();
  });

  it("keeps a key already set", async () => {
    expect(
      await sentKey({ method: "POST", headers: { "Idempotency-Key": "queued" } }, () => "new"),
    ).toBe("queued");
  });

  it("mints a UUID by default", async () => {
    expect(await sentKey({ method: "POST" })).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });
});
