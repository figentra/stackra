/**
 * Stackra file contract:
 * Purpose: unit tests of the spend stop: `spendStop` refuses a percentage that is not whole and positive; the function
 *          source (`SPEND_STOP_SOURCE`), run in a sandbox with a fake `fetch`, ignores a notification under the stop,
 *          detaches billing at the stop, leaves an already detached project alone and throws when the detach fails.
 * Boundary: test only; the source runs in `node:vm` with a fake `fetch`, so nothing reaches the metadata server or the
 *           Cloud Billing API.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0172 (decision 5), ADR 0401.
 */
import { runInNewContext } from "node:vm";

import * as gcp from "@pulumi/gcp";
import { describe, expect, it } from "@stackra/testing";

import { SPEND_STOP_SOURCE } from "#node/constants/spend-stop-source.constant";
import { spendStop } from "#node/functions/spend-stop.function";
import { mockPulumi } from "#testing/functions/mock-pulumi.function";

/** One fetch the source made. */
type Call = { url: string; method: string; body?: string };

/** The source's `stopSpend`, run against a fake `fetch` that answers `billingEnabled` and `detachOk`. */
function stopSpend(options: { billingEnabled: boolean; detachOk: boolean }) {
  const calls: Call[] = [];
  const fetch = async (url: string, init: { method?: string; body?: string } = {}) => {
    calls.push({
      url,
      method: init.method ?? "GET",
      ...(init.body !== undefined && { body: init.body }),
    });
    const body = url.includes("metadata")
      ? { access_token: "token" }
      : { billingEnabled: options.billingEnabled };
    return { ok: init.method !== "PUT" || options.detachOk, status: 403, json: async () => body };
  };
  const exports: { stopSpend?: (event: unknown) => Promise<string> } = {};
  runInNewContext(SPEND_STOP_SOURCE, {
    exports,
    fetch,
    Buffer,
    console: { log: () => undefined },
    process: { env: { PROJECT_ID: "acme-nonprod", STOP_AT_PERCENT: "100" } },
  });
  const notify = (costAmount: number) =>
    (exports.stopSpend as (event: unknown) => Promise<string>)({
      data: {
        message: {
          data: Buffer.from(JSON.stringify({ costAmount, budgetAmount: 500 })).toString("base64"),
        },
      },
    });
  return { calls, notify };
}

describe("spend stop", () => {
  it("ignores a notification under the stop", async () => {
    const { calls, notify } = stopSpend({ billingEnabled: true, detachOk: true });
    expect(await notify(499)).toBe("under");
    expect(calls).toEqual([]);
  });

  it("detaches billing at the stop", async () => {
    const { calls, notify } = stopSpend({ billingEnabled: true, detachOk: true });
    expect(await notify(500)).toBe("stopped");
    expect(calls.at(-1)).toEqual({
      url: "https://cloudbilling.googleapis.com/v1/projects/acme-nonprod/billingInfo",
      method: "PUT",
      body: JSON.stringify({ billingAccountName: "" }),
    });
  });

  it("leaves a detached project alone and throws when the detach fails", async () => {
    expect(await stopSpend({ billingEnabled: false, detachOk: true }).notify(900)).toBe("detached");
    await expect(stopSpend({ billingEnabled: true, detachOk: false }).notify(900)).rejects.toThrow(
      /failed: 403/,
    );
  });

  it("refuses a stop that is not a whole positive percentage", async () => {
    await mockPulumi();
    const topic = new gcp.pubsub.Topic("budgets", { project: "acme-nonprod" });
    const args = {
      project: "acme-nonprod",
      region: "europe-west3",
      topic,
      accountId: "acme-staging-stop",
    };
    expect(() => spendStop("acme-staging", { ...args, stopAt: 0 }, {})).toThrow(TypeError);
    expect(() => spendStop("acme-staging", { ...args, stopAt: 99.5 }, {})).toThrow(TypeError);
  });
});
