/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./worker` entry: exactly `WorkersCacheDriver`, the symbol the template's
 *          generated web wiring imports from `@stackra/cache/worker`.
 * Boundary: test only; imports the stand-in barrel through its `#worker` alias, with the Workers binding lookup mocked
 *           so the module loads in Node.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import * as worker from "#worker/index";

vi.mock("#worker/functions/worker-binding.function", () => ({ workerBinding: () => undefined }));

describe("@stackra/cache/worker", () => {
  it("exports exactly the Workers driver", () => {
    expect(Object.keys(worker)).toEqual(["WorkersCacheDriver"]);
  });
});
