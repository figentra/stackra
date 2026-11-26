/**
 * Stackra file contract:
 * Purpose: unit tests of `LivenessController`: `GET /healthz` is 200 `{ "status": "up" }` and calls no dependency,
 *          `HEAD` is the same without a body, any other method is 405.
 * Boundary: test only; the controller is called directly with Fetch requests. The route and the controller kind are
 *           read back from the kind registry, which is what gen builds the adapter from.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0190 (health); ADR 0294 (decision 25).
 */
import { kindOf } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";

import { LivenessController } from "#modules/health/raw/liveness.controller";

const request = (method: string) => new Request("http://service.test/healthz", { method });

/** The liveness probe. */
describe(LivenessController, () => {
  /** Gen reads the kind and the path from the registry. */
  it("is a controller at /healthz", () => {
    expect(kindOf(LivenessController)?.kind).toBe("controller");
    expect(kindOf(LivenessController)?.options).toMatchObject({ path: "/healthz" });
  });

  /** The process is up: 200 and the status, with no dependency involved (the controller takes none). */
  it("answers 200 up without calling any dependency", async () => {
    const response = await new LivenessController().handle(request("GET"));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ status: "up" });
    expect(LivenessController.length).toBe(0);
  });

  /** A HEAD gets the status only. */
  it("answers a HEAD with 200 and no body", async () => {
    const response = await new LivenessController().handle(request("HEAD"));
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("");
  });

  /** A write method is refused with the allowed list. */
  it("refuses other methods with 405", async () => {
    for (const method of ["POST", "PUT", "DELETE"]) {
      const response = await new LivenessController().handle(request(method));
      expect(response.status).toBe(405);
      expect(response.headers.get("allow")).toBe("GET, HEAD");
    }
  });
});
