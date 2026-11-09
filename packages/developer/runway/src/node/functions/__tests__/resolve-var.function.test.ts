/**
 * Stackra file contract:
 * Purpose: unit tests of `resolveVar`: a literal as written; `from-port` as the member's own dev origin; a port or
 *          member reference as that origin with its scheme and path (infra before members for a port); a `ref:` or
 *          `${pr}` value from the build environment; and each refusal (a deploy-time value unset, a dev reference
 *          outside dev or without dev facts, a key the facts do not hold), named without a value.
 * Boundary: test only; the dev facts are a parsed document and the build environment is stubbed.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0296 (decision 1), ADR 0175, ADR 0173.
 */
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { parseRunwayFacts } from "#core/functions/parse-runway-facts.function";
import { resolveVar } from "#node/functions/resolve-var.function";

/** Lane-0 dev facts: the gateway as infra and as a member, the console and the mobile app. */
const FACTS = parseRunwayFacts(
  {
    version: 1,
    infra: { gateway: { port: 4000, url: "http://localhost:4000" } },
    members: {
      gateway: { url: "http://localhost:4999", port: 4999 },
      console: { url: "https://localhost:5173", port: 5173 },
      mobile: { url: "http://localhost:8081", port: 8081 },
    },
  },
  "ports.json",
);

const devFacts = () => FACTS;

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("resolveVar", () => {
  it("keeps a literal as written", () => {
    expect(resolveVar("VITE_NAME", "acme", "console", "production", devFacts)).toBe("acme");
    expect(resolveVar("VITE_LIMIT", 20, "console", "production", devFacts)).toBe("20");
    expect(resolveVar("VITE_BETA", false, "console", "production", devFacts)).toBe("false");
  });

  it("resolves dev references against the dev facts", () => {
    expect(resolveVar("EXPO_PUBLIC_SELF", "from-port", "mobile", "dev", devFacts)).toBe(
      "http://localhost:8081",
    );
    expect(
      resolveVar(
        "EXPO_PUBLIC_REALTIME_ORIGIN",
        { "from-port": "gateway", scheme: "ws", path: "/realtime" },
        "mobile",
        "dev",
        devFacts,
      ),
    ).toBe("ws://localhost:4000/realtime");
    expect(
      resolveVar("EXPO_PUBLIC_CONSOLE", { "from-member": "console" }, "mobile", "dev", devFacts),
    ).toBe("https://localhost:5173");
  });

  it("reads a deploy-time value from the build environment, and fails when it is unset", () => {
    vi.stubEnv("VITE_API_ORIGIN", "https://api-pr-7.preview.acme.example");
    const origin = "https://api-pr-${pr}.preview.acme.example";
    expect(resolveVar("VITE_API_ORIGIN", origin, "console", "preview", devFacts)).toBe(
      "https://api-pr-7.preview.acme.example",
    );

    vi.stubEnv("VITE_KEY", undefined);
    expect(() =>
      resolveVar("VITE_KEY", "ref:payments.publishable", "console", "production", devFacts),
    ).toThrow(/^VITE_KEY is resolved at deploy/);
  });

  it("refuses a dev reference outside dev or without dev facts", () => {
    expect(() => resolveVar("VITE_SELF", "from-port", "console", "staging", devFacts)).toThrow(
      "VITE_SELF names a dev origin, which has no value in staging",
    );
    expect(() => resolveVar("VITE_SELF", "from-port", "console", "dev", () => undefined)).toThrow(
      /run `stackra dev` first/,
    );
  });

  it("refuses a port or member the dev facts do not hold", () => {
    expect(() =>
      resolveVar("VITE_CACHE", { "from-port": "redis" }, "console", "dev", devFacts),
    ).toThrow(RunwayUnresolvedError);
    expect(() =>
      resolveVar("VITE_DOCS", { "from-member": "constructor" }, "console", "dev", devFacts),
    ).toThrow('VITE_DOCS names the dev member "constructor", which the dev facts do not hold');
  });
});
