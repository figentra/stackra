/**
 * Stackra file contract:
 * Purpose: unit tests of `createPublicClients`: a public query and action carry the pinned version, the locale, the
 *          market and the forwarded facts; a network failure is retried with a retry policy (the contracts
 *          `RetryPolicy`; `on` became `retryOn` in stackra-223); any area but the public one is refused.
 * Boundary: test only; `fetch` is stubbed, so nothing reaches a network.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0082 (API areas); ADR 0118; ADR 0140.
 */
import { ApiArea, HttpMethod, RetryOn } from "@stackra/contracts";
import { Locale } from "@stackra/i18n";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";
import { z } from "zod";

import { actionRef } from "#core/functions/action-ref.function";
import { queryRef } from "#core/functions/query-ref.function";
import { createPublicClients } from "#server/functions/create-public-clients.function";

class ListPlansQuery extends queryRef("billing.catalog.plan.list", {
  input: z.object({ product: z.string() }),
  output: z.object({ trialDays: z.number().int() }),
  http: { method: HttpMethod.Get, path: "/public/plans" },
}) {}

class RecordNotFoundAction extends actionRef("seo.not_found.record", {
  input: z.object({ path: z.string() }),
  output: z.object({}),
  http: { method: HttpMethod.Post, path: "/public/seo/not-found" },
}) {}

const BASE = { baseUrl: "https://api.acme.example", area: ApiArea.Public } as const;

describe("createPublicClients", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends a public query with the version, locale, market and forwarded facts", async () => {
    const seen: Request[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn((request: Request) => {
        seen.push(request);
        return Promise.resolve(Response.json({ trialDays: 14 }));
      }),
    );
    const clients = createPublicClients({
      ...BASE,
      version: "2027-03-01",
      locale: Locale.Ar,
      market: "sa",
      forward: Promise.resolve({ traceparent: "00-abc-def-01" }),
    });
    expect(await clients.query(ListPlansQuery, { product: "stackra" })).toEqual({ trialDays: 14 });
    expect(seen[0]?.url).toBe("https://api.acme.example/public/plans?product=stackra");
    expect(seen[0]?.headers.get("Stackra-Version")).toBe("2027-03-01");
    expect(seen[0]?.headers.get("Accept-Language")).toBe("ar");
    expect(seen[0]?.headers.get("Stackra-Market")).toBe("sa");
    expect(seen[0]?.headers.get("traceparent")).toBe("00-abc-def-01");
  });

  it("retries a public read once after a network failure", async () => {
    const fetch = vi
      .fn<(request: Request) => Promise<Response>>()
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValue(Response.json({ trialDays: 7 }));
    vi.stubGlobal("fetch", fetch);
    const clients = createPublicClients({
      ...BASE,
      retry: { attempts: 2, retryOn: RetryOn.Network },
    });
    expect(await clients.query(ListPlansQuery, { product: "stackra" })).toEqual({ trialDays: 7 });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("sends a public action as JSON", async () => {
    const seen: Request[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn((request: Request) => {
        seen.push(request);
        return Promise.resolve(Response.json({}));
      }),
    );
    await createPublicClients(BASE).action(RecordNotFoundAction, { path: "/old" });
    expect(seen[0]?.method).toBe("POST");
    expect(await seen[0]?.json()).toEqual({ path: "/old" });
  });

  it("refuses any area but the public one", () => {
    expect(() => createPublicClients({ ...BASE, area: ApiArea.Admin })).toThrow(RangeError);
  });
});
