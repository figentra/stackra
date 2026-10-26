/**
 * Stackra file contract:
 * Purpose: `E2ePresetOptions`, what gen's `playwright.config.ts` passes `e2ePreset`: the member root and package, the
 *          origin and target the stack serves, the consumed services and seeds the stack starts with, the Turnstile
 *          mode and the projects.
 * Boundary: a type only; every value comes from the member's config and runway, never typed by hand.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 6); ADR 0295 (decision 5: generated tool configs); ADR 0296 (runway).
 */
import type { E2eProject } from "#e2e/e2e-preset/e2e-project.type";

/** The options of an app's e2e config. */
export interface E2ePresetOptions {
  /** The member root: the test directory, and where the stack starts. */
  readonly root: string;

  /** The app's package name (`@acme/console`). */
  readonly app: string;

  /** The app's dev origin (`baseUrlOf("console")`). */
  readonly baseURL: string;

  /** The app target the stack serves (`web`); `stackra dev`'s default when left out. */
  readonly target?: string;

  /** The consumed services the stack runs on memory drivers (`@acme/service-commerce`, `billing`). */
  readonly services?: readonly string[];

  /** The seeder keys the stack runs once before the run (`orders.demo`). */
  readonly seeds?: readonly string[];

  /** `test-keys`: the Turnstile widget and secret are Cloudflare's always-pass test keys. */
  readonly turnstile?: "test-keys";

  /** The projects: a runner name (`chromium`, `mobile-safari`) or a project. */
  readonly projects: readonly (string | E2eProject)[];
}
