/**
 * Proves the presets compose: the decorators preset keeps the base options and adds the oxc decorator flags
 * without metadata emission or setup files (ADR-0005); the react preset switches the environment to jsdom.
 */
import { describe, expect, it } from "vitest";
import { stackraVitest } from "../preset.ts";
import { stackraVitestDecorators } from "../preset-decorators.ts";
import { stackraVitestReact } from "../preset-react.ts";

describe("@stackra/vitest-config", () => {
  it("base preset refuses empty suites and enables globals", () => {
    expect(stackraVitest.test?.globals).toBe(true);
    expect(stackraVitest.test?.passWithNoTests).toBe(false);
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
