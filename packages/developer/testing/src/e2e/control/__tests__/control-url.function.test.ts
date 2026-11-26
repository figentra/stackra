/**
 * Stackra file contract:
 * Purpose: unit tests of `controlUrl`: a control path resolves against the running project's `baseURL`, and a
 *          project without one throws the fix.
 * Boundary: test only; `@playwright/test` is mocked to a `test.info()` whose project `use` the test sets, so the
 *           Playwright runner never loads under vitest.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (decision 6); ADR 0182 (decision 2: coverage floors).
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { controlUrl } from "#e2e/control/control-url.function";
import { E2E_CONTROL } from "#e2e/control/e2e-control.constant";

const project = vi.hoisted(() => ({ use: {} as { baseURL?: string } }));

vi.mock("@playwright/test", () => ({ test: { info: () => ({ project }) } }));

describe("controlUrl", () => {
  it("resolves a control path against the project's baseURL", () => {
    project.use = { baseURL: "http://localhost:5174/app/" };
    expect(controlUrl(E2E_CONTROL.seed)).toBe("http://localhost:5174/__stackra/e2e/seed");
  });

  it("throws the fix when the project has no baseURL", () => {
    project.use = {};
    expect(() => controlUrl(E2E_CONTROL.session)).toThrow(
      "the e2e project has no baseURL: build the config with e2ePreset({ baseURL })",
    );
  });
});
