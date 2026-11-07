/**
 * Stackra file contract:
 * Purpose: unit tests of `originFrameAncestorResolver`: it asks the origin's well-known path with the request path,
 *          signed so the API's `EdgeHeaderGuard` accepts it; it keeps an answer for its cache time; a non-200, a
 *          malformed body or a failed fetch is none (and kept too).
 * Boundary: test only; a recording origin fetch and the real `EdgeHeaderGuard` with its memory drivers.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0437 (decision 2); STA-2562.
 */
import {
  EdgeHeaderGuard,
  MemoryEdgeNonceStoreDriver,
  MemoryEdgeSigningKeysDriver,
} from "@stackra/app/server";
import { buildConfig } from "@stackra/config";
import { CspConfig } from "@stackra/csp";

import { FRAME_ANCESTORS_PATH } from "#src/http/frame-ancestors-path";
import { originFrameAncestorResolver } from "#src/http/origin-frame-ancestor-resolver";
import type { HostEntry } from "#src/interfaces/host-entry.interface";

const SECRET = "edge-secret";
const HOST: HostEntry = { product: "pay", surface: "checkout", realm: "public", scope: null };

/** A resolver over an origin that answers with `answer`; `asked` holds what reached it; `clock` moves time. */
function resolver(answer: () => Promise<Response>) {
  const asked: Request[] = [];
  const clock = { now: new Date("2026-11-07T00:00:00Z") };
  let id = 0;
  const resolve = originFrameAncestorResolver(
    {
      settings: {
        origin: "https://api.internal.example",
        hosts: {},
        issuer: "",
        audience: "",
        keysSeconds: 60,
        leewaySeconds: 0,
        csp: {},
        baselineCsp: buildConfig(CspConfig),
        frameAncestorsSeconds: 60,
      },
      secret: SECRET,
      fetcher: (async (request: Request) => {
        asked.push(request);
        return answer();
      }) as unknown as typeof fetch,
      now: () => clock.now,
      requestId: () => `req-${++id}`,
    },
    60,
  );
  return { resolve, asked, clock };
}

describe("originFrameAncestorResolver", () => {
  it("asks the origin, signed, and keeps the answer for its cache time", async () => {
    const { resolve, asked, clock } = resolver(async () =>
      Response.json({ origins: ["https://shop.example"] }),
    );
    expect(await resolve.resolve(HOST, "checkout.pay.example", "/c/cs 01")).toEqual([
      "https://shop.example",
    ]);
    const [out] = asked;
    if (out === undefined) throw new Error("nothing asked");
    expect(out.url).toBe(`https://api.internal.example${FRAME_ANCESTORS_PATH}?path=%2Fc%2Fcs%2001`);
    const keys = new MemoryEdgeSigningKeysDriver();
    keys.secrets = [SECRET];
    await expect(
      new EdgeHeaderGuard(keys, new MemoryEdgeNonceStoreDriver()).check(out),
    ).resolves.toBeUndefined();
    await resolve.resolve(HOST, "checkout.pay.example", "/c/cs 01");
    expect(asked).toHaveLength(1);
    clock.now = new Date(clock.now.getTime() + 61_000);
    await resolve.resolve(HOST, "checkout.pay.example", "/c/cs 01");
    expect(asked).toHaveLength(2);
  });

  it.each([
    ["a 404", async () => new Response("no", { status: 404 })],
    ["a body without origins", async () => Response.json({ framers: ["https://shop.example"] })],
    ["a non-string origin", async () => Response.json({ origins: [1] })],
    [
      "a failed fetch",
      async () => {
        throw new TypeError("network");
      },
    ],
  ])("answers none for %s, and keeps that too", async (_name, answer) => {
    const { resolve, asked } = resolver(answer);
    expect(await resolve.resolve(HOST, "checkout.pay.example", "/c/x")).toBeUndefined();
    expect(await resolve.resolve(HOST, "checkout.pay.example", "/c/x")).toBeUndefined();
    expect(asked).toHaveLength(1);
  });
});
