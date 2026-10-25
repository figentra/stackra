/**
 * Stackra file contract:
 * Purpose: unit and type tests of `devPorts`: a member's dev origin, port, host and Electron dev ports, spreadable into
 *          the generated Electron entry's dev config; `{}` desktop for a member without one; a member without a dev
 *          server fails.
 * Boundary: test only; the facts are injected through `__STACKRA_RUNWAY__`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0296 (decision 1); ADR 0251.
 */
import { afterEach, describe, expect, expectTypeOf, it } from "@stackra/testing";
import { vi } from "vitest";

import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { devPorts } from "#core/functions/dev-ports.function";
import type { DevPorts } from "#core/types/dev-ports.type";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("devPorts", () => {
  it("returns the dev server and the Electron dev ports", () => {
    vi.stubGlobal("__STACKRA_RUNWAY__", {
      version: 1,
      members: {
        console: {
          url: "http://localhost:5173",
          port: 5173,
          host: "localhost",
          desktop: { devtools: true, remoteDebugPort: 9222, pkceLoopbackPort: 5179 },
        },
        web: { url: "http://localhost:5175", port: 5175, host: "localhost" },
      },
    });

    const dev = devPorts("console");
    expectTypeOf(dev).toEqualTypeOf<DevPorts>();
    expect(dev).toEqual({
      url: "http://localhost:5173",
      port: 5173,
      host: "localhost",
      desktop: { devtools: true, remoteDebugPort: 9222, pkceLoopbackPort: 5179 },
    });
    expect({ url: dev.url, ...dev.desktop }).toEqual({
      url: "http://localhost:5173",
      devtools: true,
      remoteDebugPort: 9222,
      pkceLoopbackPort: 5179,
    });
    expect(devPorts("web").desktop).toEqual({});
  });

  it("fails for a member without a dev server", () => {
    vi.stubGlobal("__STACKRA_RUNWAY__", {
      version: 1,
      members: { console: { feed: { path: "console", channel: "latest" } } },
    });

    expect(() => devPorts("console")).toThrow(RunwayUnresolvedError);
    expect(() => devPorts("console")).toThrow(/no dev server/);
  });
});
