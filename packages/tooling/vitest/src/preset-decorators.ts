/**
 * Stackra file contract:
 * Purpose: vitest preset for code that carries decorators: the base preset plus TypeScript legacy
 *          decorators, for the field, method (`@Step`, `@Transition`) and class facet decorators of
 *          ADR 0294 rule R6. No `design:*` metadata is emitted and nothing is loaded before the
 *          first decorated class: a constructor parameter names its dependency by its declared
 *          type, which gen reads from source into the wiring, and `reflect-metadata` is forbidden
 *          (ADR 0005, ADR 0294 decision 17).
 *
 * Mechanism (vitest 5 / vite 8): vite transforms TypeScript with oxc through rolldown's
 * `transformSync`; `oxc.decorator.legacy` is `experimentalDecorators`. The `app`, `mobile`,
 * `library` and `service` roles of @stackra/typescript-config set the matching tsc flags
 * (`experimentalDecorators`, no `emitDecoratorMetadata`), so `tsc --noEmit` and the test transform
 * agree. This file is the only place the option names live.
 * Boundary: adds the legacy decorator transform to the base preset; it does not emit metadata.
 * Runtime: node
 * Governing contract: ADR 0005 (legacy decorators); ADR 0294 (rule R6, decision 17); ADR 0007
 *                     (documentation).
 */
import { defineConfig, mergeConfig } from "vitest/config";
import { stackraVitest } from "./preset.ts";

/** The legacy decorator transform alone, for presets that start from another base (react, native). */
export const decoratorTransform = defineConfig({
  oxc: { decorator: { legacy: true, emitDecoratorMetadata: false } },
});

/** Base preset + legacy decorators (no metadata emission). */
export const stackraVitestDecorators = mergeConfig(stackraVitest, decoratorTransform);
