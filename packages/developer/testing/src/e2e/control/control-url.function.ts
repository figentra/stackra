/**
 * Stackra file contract:
 * Purpose: `controlUrl(path)`, one control route of the e2e stack on the running project's `baseURL`.
 * Boundary: internal to `./e2e` (not exported). Reads the current test's project, so it works only inside a test or a
 *           hook.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 6).
 */
import { test } from "@playwright/test";

/**
 * The absolute URL of `path` on the project's origin.
 *
 * @throws Error when the project has no `baseURL`.
 * @example
 * controlUrl(E2E_CONTROL.seed); // "http://localhost:5175/__stackra/e2e/seed"
 */
export function controlUrl(path: string): string {
  const baseURL = test.info().project.use.baseURL;
  if (baseURL === undefined)
    throw new Error("the e2e project has no baseURL: build the config with e2ePreset({ baseURL })");
  return new URL(path, baseURL).toString();
}
