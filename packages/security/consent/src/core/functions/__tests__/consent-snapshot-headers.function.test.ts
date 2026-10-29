/**
 * Stackra file contract:
 * Purpose: unit tests of `consentSnapshotHeaders`: the endpoint is called once per decision and the token sent in the
 *          `Stackra-Consent` header, a changed decision or a near expiry fetches again, concurrent calls share one
 *          fetch, and a failed or malformed answer sends no header (or the held one for the same decision).
 * Boundary: test only; a fake fetch and clock, no network.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0472 (decisions 1, 3 and 4).
 */
import { describe, expect, it } from "@stackra/testing";

import type { ConsentSnapshotRequest } from "#contracts/types/consent-snapshot-request.type";
import { consentSnapshotHeaders } from "#core/functions/consent-snapshot-headers.function";

const NOW = Date.parse("2026-10-29T10:00:00.000Z");

/** A fetch that answers `answers` in turn and records each call's URL and body. */
function fakeFetch(answers: (Response | Error)[]) {
  const calls: { url: string; body: string }[] = [];
  const fetch = (async (url: string, init: RequestInit) => {
    calls.push({ url, body: String(init.body) });
    const next = answers.shift() ?? new Error("no answer left");
    if (next instanceof Error) throw next;
    return next;
  }) as unknown as typeof globalThis.fetch;
  return { fetch, calls };
}

/** An endpoint answer with `token`, expiring `minutes` after NOW. */
function issued(token: string, minutes = 60): Response {
  return Response.json({ token, expiresAt: new Date(NOW + minutes * 60_000).toISOString() });
}

function setup(answers: (Response | Error)[]) {
  let request: ConsentSnapshotRequest = { record: null, globalPrivacyControl: false, region: "FR" };
  let clock = NOW;
  const { fetch, calls } = fakeFetch(answers);
  const headers = consentSnapshotHeaders({
    baseUrl: "https://api.example.com/",
    snapshotRequest: () => request,
    fetch,
    now: () => clock,
  });
  return {
    headers,
    calls,
    decide: (next: ConsentSnapshotRequest) => (request = next),
    advance: (minutes: number) => (clock += minutes * 60_000),
  };
}

describe("consentSnapshotHeaders", () => {
  it("posts the decision to the consent endpoint and sends the token", async () => {
    const { headers, calls } = setup([issued("tok_1")]);
    await expect(headers()).resolves.toEqual({ "Stackra-Consent": "tok_1" });
    await expect(headers()).resolves.toEqual({ "Stackra-Consent": "tok_1" });
    expect(calls).toEqual([
      {
        url: "https://api.example.com/consent/snapshots",
        body: JSON.stringify({ record: null, globalPrivacyControl: false, region: "FR" }),
      },
    ]);
  });

  it("fetches again at once when the decision changes, never sending the old token", async () => {
    const { headers, calls, decide } = setup([issued("tok_1"), new Error("offline")]);
    await headers();
    decide({ record: null, globalPrivacyControl: true, region: "FR" });
    await expect(headers()).resolves.toEqual({});
    expect(calls).toHaveLength(2);
  });

  it("fetches again a minute before expiry and keeps the held token if that fails", async () => {
    const { headers, calls, advance } = setup([
      issued("tok_1", 5),
      new Error("offline"),
      issued("tok_2"),
    ]);
    await headers();
    advance(4.5);
    await expect(headers()).resolves.toEqual({ "Stackra-Consent": "tok_1" });
    await expect(headers()).resolves.toEqual({ "Stackra-Consent": "tok_2" });
    expect(calls).toHaveLength(3);
  });

  it("shares one fetch between concurrent calls", async () => {
    const { headers, calls } = setup([issued("tok_1")]);
    const answers = await Promise.all([headers(), headers()]);
    expect(answers).toEqual([{ "Stackra-Consent": "tok_1" }, { "Stackra-Consent": "tok_1" }]);
    expect(calls).toHaveLength(1);
  });

  it("sends no header for a refused or malformed answer", async () => {
    const { headers } = setup([
      Response.json({ code: "rate_limited" }, { status: 429 }),
      Response.json({ token: "", expiresAt: "soon" }),
    ]);
    await expect(headers()).resolves.toEqual({});
    await expect(headers()).resolves.toEqual({});
  });
});
