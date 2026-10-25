/**
 * Stackra file contract:
 * Purpose: unit tests of `updateFeed`: `<feedOrigin>/<feedPath>/<channel>/` from the injected facts of a release
 *          build (a trailing slash on the origin is not doubled); `null` when the facts carry no feed (dev); a member
 *          absent from the facts fails.
 * Boundary: test only; the facts are injected through `__STACKRA_RUNWAY__`, as a packaged Electron app carries them.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0254 (the feed); ADR 0296 (decision 1).
 */
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { updateFeed } from "#core/functions/update-feed.function";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("updateFeed", () => {
  it("joins the root feed origin, the member's feed path and the environment's channel", () => {
    vi.stubGlobal("__STACKRA_RUNWAY__", {
      version: 1,
      environment: "production",
      feedOrigin: "https://downloads.acme.example/",
      members: { console: { feed: { path: "console", channel: "latest" } } },
    });

    expect(updateFeed("console")).toBe("https://downloads.acme.example/console/latest/");
  });

  it("returns null where there is no feed", () => {
    vi.stubGlobal("__STACKRA_RUNWAY__", {
      version: 1,
      members: { console: { url: "http://localhost:5173", port: 5173, host: "localhost" } },
    });

    expect(updateFeed("console")).toBeNull();
  });

  it("fails for a member the facts do not hold", () => {
    vi.stubGlobal("__STACKRA_RUNWAY__", { version: 1, members: {} });

    expect(() => updateFeed("console")).toThrow(RunwayUnresolvedError);
  });
});
