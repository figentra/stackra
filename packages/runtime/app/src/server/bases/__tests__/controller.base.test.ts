/**
 * Stackra file contract:
 * Purpose: unit tests of `Controller`: a subclass is registered as kind `controller` with its path, two controllers
 *          keep their own paths, and the subclass's `handle` answers a Fetch response.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decisions 16 and 25).
 */
import { kindOf } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";

import { Controller } from "#server/bases/controller.base";

class AuthCallbackController extends Controller({ path: "/api/auth/callback" }) {
  handle(request: Request): Promise<Response> {
    return Promise.resolve(new Response(new URL(request.url).pathname));
  }
}

class OrderStreamController extends Controller({ path: "/orders/stream" }) {
  handle(): Promise<Response> {
    return Promise.resolve(new Response("stream"));
  }
}

describe("Controller", () => {
  it("registers the kind and the path", () => {
    expect(kindOf(AuthCallbackController)?.kind).toBe("controller");
    expect(kindOf(AuthCallbackController)?.options).toEqual({ path: "/api/auth/callback" });
  });

  it("keeps each controller's own path", () => {
    expect(kindOf(OrderStreamController)?.options["path"]).toBe("/orders/stream");
  });

  it("answers through handle", async () => {
    const response = await new AuthCallbackController().handle(
      new Request("https://api.example.com/api/auth/callback"),
    );
    await expect(response.text()).resolves.toBe("/api/auth/callback");
  });
});
