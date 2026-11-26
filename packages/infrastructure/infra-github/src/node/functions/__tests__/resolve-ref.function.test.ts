/**
 * Stackra file contract:
 * Purpose: unit tests of `resolveRef`: a literal passes through; `ref:<key>` reads a plain key and
 *          `ref:<key>.<path>` walks the key's structured value; an unset key or a path that ends on no string or
 *          number fails naming the ref.
 * Boundary: test only; `pulumi.runtime.setMocks` and `setAllConfig` stand in for the engine and the stack config.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0171 (decision 4).
 */
import * as pulumi from "@pulumi/pulumi";
import { beforeAll, describe, expect, it } from "@stackra/testing";

import { resolveRef } from "#node/functions/resolve-ref.function";

beforeAll(async () => {
  await pulumi.runtime.setMocks(
    { newResource: (args) => ({ id: `${args.name}-id`, state: {} }), call: () => ({}) },
    "infra",
    "staging",
    false,
  );
  pulumi.runtime.setAllConfig({
    "infra:org": "acme",
    "infra:ids": JSON.stringify({ workspace: "ws-123", identities: { ci: 42 } }),
  });
});

describe("resolveRef", () => {
  it("passes a literal through and resolves a ref from the stack config", () => {
    expect(resolveRef("https://example.com")).toBe("https://example.com");
    expect(resolveRef("ref:org")).toBe("acme");
    expect(resolveRef("ref:ids.workspace")).toBe("ws-123");
    expect(resolveRef("ref:ids.identities.ci")).toBe("42");
  });

  it("fails on an unset key or a path that holds no value", () => {
    expect(() => resolveRef("ref:missing")).toThrow();
    expect(() => resolveRef("ref:ids.identities")).toThrow(/ref:ids\.identities is not set/);
    expect(() => resolveRef("ref:ids.nothing.here")).toThrow(/is not set/);
  });
});
