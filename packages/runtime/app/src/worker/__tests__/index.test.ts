/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./worker` entry: `createApp` (the template's Worker entry imports it) is the
 *          only value, and `WorkerRequest<E>` (its `context.ts` imports the type) carries the typed env.
 * Boundary: test only; imports the stand-in barrel through its `#worker` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0295 (decision 8); ADR 0127 2026-10-24 note.
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as worker from "#worker/index";
import type { WorkerApp, WorkerRequest } from "#worker/index";

describe("@stackra/app/worker", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(worker)).toEqual(["createApp"]);
  });

  it("types the request's env and resolves createApp to a WorkerApp", () => {
    expectTypeOf<WorkerRequest<{ site: string }>["env"]>().toEqualTypeOf<{ site: string }>();
    expectTypeOf(worker.createApp).returns.resolves.toEqualTypeOf<WorkerApp>();
  });
});
