/**
 * Stackra file contract:
 * Purpose: unit tests of `workerBinding`: it answers the Worker binding of a name, as the Worker runtime's `env` holds
 *          it (the same object, not a copy), and `undefined` for a name the Worker has none of.
 * Boundary: test only; the runtime module `cloudflare:workers` is mocked with a fixed `env`, because it exists in a Worker
 *           only. Every other test mocks this function away, so this file is the one that runs it.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0284 (Workers members);
 *                     ADR 0297 (decision 3).
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { workerBinding } from "#worker/functions/worker-binding.function";

/** The Worker's `env`, built before the hoisted mock factory reads it. */
const worker = vi.hoisted(() => ({
  env: { PAGE_CACHE: { kind: "kv-namespace" }, LIMIT: 60, OFF: false },
}));

vi.mock("cloudflare:workers", () => ({ env: worker.env }));

describe("workerBinding", () => {
  it("answers the binding of a name: the object the runtime holds", () => {
    expect(workerBinding("PAGE_CACHE")).toBe(worker.env.PAGE_CACHE);
  });

  it("answers a binding that is a plain value, falsy ones included", () => {
    expect(workerBinding("LIMIT")).toBe(60);
    expect(workerBinding("OFF")).toBe(false);
  });

  it("answers undefined when the Worker has no binding of that name", () => {
    expect(workerBinding("MISSING_CACHE")).toBeUndefined();
  });
});
