/**
 * Stackra file contract:
 * Purpose: vitest preset for React libraries and the console app: the base preset in a jsdom environment
 *          with Testing Library's matchers available through the consumer's own setup file.
 * Boundary: adds the jsdom environment to the base preset; the consumer owns its setup file.
 * Runtime: node
 * Governing contract: ADR 0007 (documentation).
 * Owner: release-operations · Secrets: forbidden
 */
import { defineConfig, mergeConfig } from "vitest/config";
import { stackraVitest } from "./preset.ts";

/** Base preset + jsdom. The consumer adds `@testing-library/jest-dom/vitest` in its own setupFiles. */
export const stackraVitestReact = mergeConfig(
  stackraVitest,
  defineConfig({ test: { environment: "jsdom", css: false } }),
);
