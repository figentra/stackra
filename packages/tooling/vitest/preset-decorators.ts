/**
 * Stackra file contract:
 * Purpose: vitest preset for the DI tier: the base preset plus TypeScript legacy decorators. No `design:*`
 *          metadata is emitted and nothing is loaded before the first decorated class (ADR-0007: dependencies
 *          are named with @Inject(token); `reflect-metadata` is forbidden).
 *
 * Mechanism (vitest 5 / vite 8): vite transforms TypeScript with oxc through rolldown's `transformSync`;
 * `oxc.decorator.legacy` is `experimentalDecorators`. `@stackra/typescript-config/decorators` sets the
 * matching tsc flags so `tsc --noEmit` and the test transform agree. This file is the only place the option
 * names live.
 * Owner: release-operations · Secrets: forbidden
 */
import { defineConfig, mergeConfig } from "vitest/config";
import { stackraVitest } from "./preset.ts";

/** Base preset + legacy decorators (no metadata emission). */
export const stackraVitestDecorators = mergeConfig(
  stackraVitest,
  defineConfig({
    oxc: { decorator: { legacy: true, emitDecoratorMetadata: false } },
  }),
);
