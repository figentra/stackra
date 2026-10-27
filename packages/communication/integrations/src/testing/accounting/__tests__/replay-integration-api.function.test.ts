/**
 * Stackra file contract:
 * Purpose: unit tests of `replayIntegrationApi`: recorded calls answer in order; a call that differs in method, path,
 *          query, body or idempotency key, or one past the end, rejects with a `TypeError`; a recorded refusal rejects
 *          with `ProviderRefusedError`; `done()` refuses while a recorded call is left.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269 (decision 3); ADR 0443 (decision 8).
 */
import { describe, expect, it } from "@stackra/testing";

import { ProviderRefusedError } from "#core/index";
import { replayIntegrationApi } from "#testing/accounting/replay-integration-api.function";

describe("replayIntegrationApi", () => {
  it("answers the recorded calls in order", async () => {
    const api = replayIntegrationApi("ledger", [
      { method: "GET", path: "/journals", query: { reference: "k1" }, answer: { journals: [] } },
      {
        method: "POST",
        path: "/journals",
        body: { memo: "Invoice 1" },
        idempotencyKey: "k1",
        answer: { id: "J-1" },
      },
    ]);
    await expect(api.get("/journals", { query: { reference: "k1" } })).resolves.toEqual({
      journals: [],
    });
    await expect(
      api.post("/journals", { memo: "Invoice 1" }, { idempotencyKey: "k1" }),
    ).resolves.toEqual({
      id: "J-1",
    });
    expect(api.calls).toBe(2);
    expect(() => api.done()).not.toThrow();
    await expect(api.get("/journals")).rejects.toThrow(TypeError);
  });

  it("refuses a call that differs from the recording", async () => {
    const recorded = [
      { method: "POST", path: "/journals", body: { memo: "a" }, idempotencyKey: "k1", answer: {} },
    ] as const;
    await expect(
      replayIntegrationApi("ledger", recorded).put("/journals", { memo: "a" }),
    ).rejects.toThrow(/method or path/);
    await expect(
      replayIntegrationApi("ledger", recorded).post(
        "/journals",
        { memo: "b" },
        { idempotencyKey: "k1" },
      ),
    ).rejects.toThrow(/body/);
    await expect(
      replayIntegrationApi("ledger", recorded).post(
        "/journals",
        { memo: "a" },
        { idempotencyKey: "k2" },
      ),
    ).rejects.toThrow(/idempotency key/);
    await expect(
      replayIntegrationApi("ledger", [{ method: "GET", path: "/a", query: { q: 1 } }]).get("/a"),
    ).rejects.toThrow(/query/);
  });

  it("replays a refusal and reports a call never made", async () => {
    const api = replayIntegrationApi("ledger", [
      { method: "GET", path: "/journals/k1", refusal: { status: 404, code: "not_found" } },
      { method: "GET", path: "/accounts", answer: [] },
    ]);
    const refused = await api.get("/journals/k1").catch((error: unknown) => error);
    expect(refused).toBeInstanceOf(ProviderRefusedError);
    expect((refused as ProviderRefusedError).status).toBe(404);
    expect(() => api.done()).toThrow(/GET \/accounts \(call 2\) was never made/);
  });
});
