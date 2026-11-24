/**
 * Stackra file contract:
 * Purpose: unit tests of `controlUrl`: a path resolves against the running e2e project's baseURL, and a project without a baseURL is
 *          refused with the fix (build the config with `e2ePreset({ baseURL })`).
 * Boundary: test only; `@playwright/test`'s `test.info()` is replaced by a stub.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269.
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { controlUrl } from "#e2e/control/control-url.function";

const { info } = vi.hoisted(() => ({ info: vi.fn() }));
vi.mock("@playwright/test", () => ({ test: { info } }));

describe("controlUrl", () => {
  it("resolves a path against the project's baseURL", () => {
    info.mockReturnValue({ project: { use: { baseURL: "http://127.0.0.1:3710" } } });
    expect(controlUrl("/__stackra/e2e/seed")).toBe("http://127.0.0.1:3710/__stackra/e2e/seed");
  });

  it("keeps a baseURL's own path out of an absolute control path", () => {
    info.mockReturnValue({ project: { use: { baseURL: "http://localhost:4000/app/" } } });
    expect(controlUrl("/__stackra/e2e/session")).toBe(
      "http://localhost:4000/__stackra/e2e/session",
    );
  });

  it("refuses a project with no baseURL, naming the fix", () => {
    info.mockReturnValue({ project: { use: {} } });
    expect(() => controlUrl("/x")).toThrow(
      /no baseURL: build the config with e2ePreset\(\{ baseURL \}\)/,
    );
  });
});
