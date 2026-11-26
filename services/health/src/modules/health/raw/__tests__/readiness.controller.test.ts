/**
 * Stackra file contract:
 * Purpose: unit tests of `ReadinessController`: `GET /readyz` answers the readiness service's status and body (200
 *          ready, 503 not), `HEAD` the status without a body, any other method 405 without running a check.
 * Boundary: test only; the controller is called directly with a stand-in `ReadinessService` that counts its calls.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0190 (health); ADR 0294 (decision 25).
 */
import { kindOf } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";

import { ReadinessController } from "#modules/health/raw/readiness.controller";
import type { ReadinessService } from "#modules/health/services/readiness.service";
import type { ReadinessAnswer } from "#modules/health/types/readiness-answer.type";

const request = (method: string) => new Request("http://service.test/readyz", { method });

/** A readiness service that answers `answer` and counts its checks. */
function readiness(answer: ReadinessAnswer): { service: ReadinessService; calls: () => number } {
  let calls = 0;
  const service = {
    check: async () => {
      calls += 1;
      return answer;
    },
  } as unknown as ReadinessService;
  return { service, calls: () => calls };
}

/** The readiness probe. */
describe(ReadinessController, () => {
  /** Gen reads the kind and the path from the registry. */
  it("is a controller at /readyz", () => {
    expect(kindOf(ReadinessController)?.kind).toBe("controller");
    expect(kindOf(ReadinessController)?.options).toMatchObject({ path: "/readyz" });
  });

  /** Ready: 200 with each indicator by name. */
  it("answers 200 with each indicator's status when the service is ready", async () => {
    const { service } = readiness({ status: 200, body: { database: "up", migrations: "up" } });
    const response = await new ReadinessController(service).handle(request("GET"));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ database: "up", migrations: "up" });
  });

  /** Not ready: 503 and the body names the failed dependency. */
  it("answers 503 naming the dependency that is down", async () => {
    const { service } = readiness({ status: 503, body: { database: "down", migrations: "up" } });
    const response = await new ReadinessController(service).handle(request("GET"));
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ database: "down", migrations: "up" });
  });

  /** A HEAD checks and answers the status without a body. */
  it("answers a HEAD with the status and no body", async () => {
    const { service, calls } = readiness({ status: 503, body: { database: "down" } });
    const response = await new ReadinessController(service).handle(request("HEAD"));
    expect(response.status).toBe(503);
    expect(await response.text()).toBe("");
    expect(calls()).toBe(1);
  });

  /** A write method is refused before any dependency is probed. */
  it("refuses other methods with 405 and runs no check", async () => {
    const { service, calls } = readiness({ status: 200, body: {} });
    const response = await new ReadinessController(service).handle(request("POST"));
    expect(response.status).toBe(405);
    expect(response.headers.get("allow")).toBe("GET, HEAD");
    expect(calls()).toBe(0);
  });
});
