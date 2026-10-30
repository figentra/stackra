/**
 * Stackra file contract:
 * Purpose: proves the presets compose: the decorators preset keeps the base options and adds the oxc decorator flags
 * without metadata emission or setup files (ADR-0005); the react preset switches the environment to jsdom.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement).
 */
import { describe, expect, it } from "vitest";
import { availableParallelism } from "node:os";
import { HOOK_TIMEOUT_MS } from "../constants/hook-timeout.constant.ts";
import { TEST_TIMEOUT_MS } from "../constants/test-timeout.constant.ts";
import { testMaxWorkers } from "../functions/test-max-workers.function.ts";
import { stackraVitest } from "../preset.ts";
import { stackraVitestDecorators } from "../preset-decorators.ts";
import { stackraVitestReact } from "../preset-react.ts";

describe("@stackra/vitest-config", () => {
  it("base preset refuses empty suites and enables globals", () => {
    expect(stackraVitest.test?.globals).toBe(true);
    expect(stackraVitest.test?.passWithNoTests).toBe(false);
    // Every member loads workspace sources, and any of them may declare a decorated class (ADR 0005).
    const oxc = (stackraVitest as { oxc?: { decorator?: Record<string, boolean> } }).oxc;
    expect(oxc?.decorator?.legacy).toBe(true);
    expect(oxc?.decorator?.emitDecoratorMetadata).toBe(false);
  });

  it("base preset sets the forks pool and timeouts that fit PGlite-backed tests", () => {
    expect(stackraVitest.test?.pool).toBe("forks");
    expect(stackraVitest.test?.testTimeout).toBe(TEST_TIMEOUT_MS);
    expect(stackraVitest.test?.hookTimeout).toBe(HOOK_TIMEOUT_MS);
    expect(TEST_TIMEOUT_MS).toBeGreaterThan(5000);
    expect(HOOK_TIMEOUT_MS).toBeGreaterThanOrEqual(TEST_TIMEOUT_MS);
  });

  it("caps workers at half the CPUs unless STACKRA_TEST_MAX_WORKERS says otherwise", () => {
    expect(testMaxWorkers({})).toBe(Math.max(1, Math.floor(availableParallelism() / 2)));
    expect(testMaxWorkers({ STACKRA_TEST_MAX_WORKERS: "3" })).toBe(3);
    expect(testMaxWorkers({ STACKRA_TEST_MAX_WORKERS: "0" })).toBe(testMaxWorkers({}));
    expect(testMaxWorkers({ STACKRA_TEST_MAX_WORKERS: "many" })).toBe(testMaxWorkers({}));
  });

  it("decorators preset adds the legacy decorator transform without metadata or setup files", () => {
    const oxc = (
      stackraVitestDecorators as {
        oxc?: { decorator?: Record<string, boolean> };
      }
    ).oxc;
    expect(oxc?.decorator?.legacy).toBe(true);
    expect(oxc?.decorator?.emitDecoratorMetadata).toBe(false);
    expect(stackraVitestDecorators.test?.setupFiles).toBeUndefined();
    expect(stackraVitestDecorators.test?.globals).toBe(true);
  });

  it("react preset runs in jsdom", () => {
    expect(stackraVitestReact.test?.environment).toBe("jsdom");
  });
});
