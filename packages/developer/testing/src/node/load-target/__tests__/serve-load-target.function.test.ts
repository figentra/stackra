/**
 * Stackra file contract:
 * Purpose: unit tests of `serveLoadTarget` over real loopback HTTP: a scenario runs once per POST and answers 204, a
 *          throwing one answers 500 with its message and is counted, an unknown route or method answers 404, `/health`
 *          answers 204, the server-side latency reflects each run, and `close` stops the server.
 * Boundary: test only; binds 127.0.0.1 on a free port.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0182 (decision 4); STA-317.
 */
import { afterEach, describe, expect, it } from "@stackra/testing";

import { serveLoadTarget } from "#node/load-target/serve-load-target.function";
import type { LoadTarget } from "#node/load-target/load-target.type";

let target: LoadTarget | undefined;

afterEach(async () => {
  await target?.close();
  target = undefined;
});

describe("serveLoadTarget", () => {
  it("runs a scenario once per POST and times it on the server side", async () => {
    let runs = 0;
    target = await serveLoadTarget({
      push: async () => {
        runs += 1;
        await new Promise((resolve) => {
          setTimeout(resolve, 20);
        });
      },
    });
    expect(target.url).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/);
    for (let index = 0; index < 3; index += 1) {
      const response = await fetch(`${target.url}/scenarios/push`, { method: "POST", body: "{}" });
      expect(response.status).toBe(204);
    }
    expect(runs).toBe(3);
    const latency = target.latency("push");
    expect(latency).toMatchObject({ served: 3, failed: 0 });
    expect(latency.p50).toBeGreaterThanOrEqual(15);
    expect(latency.max).toBeGreaterThanOrEqual(latency.p50);
  });

  it("answers 500 with the message of a run that throws, and counts it", async () => {
    let calls = 0;
    target = await serveLoadTarget({
      flaky: async () => {
        calls += 1;
        if (calls % 2 === 0) throw new Error(`refused run ${calls}`);
      },
    });
    const statuses: number[] = [];
    for (let index = 0; index < 4; index += 1)
      statuses.push((await fetch(`${target.url}/scenarios/flaky`, { method: "POST" })).status);
    expect(statuses).toEqual([204, 500, 204, 500]);
    const fifth = await fetch(`${target.url}/scenarios/flaky`, { method: "POST" });
    expect(fifth.status).toBe(204);
    const last = await fetch(`${target.url}/scenarios/flaky`, { method: "POST" });
    expect(await last.text()).toBe("refused run 6");
    expect(target.latency("flaky")).toMatchObject({
      served: 3,
      failed: 3,
      firstError: "refused run 2",
    });
  });

  it("answers 404 off the scenario routes, 204 on /health, and refuses an unknown latency", async () => {
    target = await serveLoadTarget({ push: async () => {} });
    expect((await fetch(`${target.url}/scenarios/other`, { method: "POST" })).status).toBe(404);
    expect((await fetch(`${target.url}/scenarios/push`)).status).toBe(404);
    expect((await fetch(`${target.url}/scenarios/push/x`, { method: "POST" })).status).toBe(404);
    expect((await fetch(`${target.url}/health`)).status).toBe(204);
    expect(() => target?.latency("other")).toThrow('serves no scenario "other"');
    expect(target.latency("push")).toMatchObject({ served: 0, failed: 0 });
  });

  it("stops serving once closed", async () => {
    const served = await serveLoadTarget({ push: async () => {} });
    await served.close();
    await expect(fetch(`${served.url}/health`)).rejects.toThrow();
  });
});
