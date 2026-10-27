/**
 * Stackra file contract:
 * Purpose: `decoratorTransform`, the legacy decorator transform alone (`oxc.decorator.legacy`, no metadata), for
 *          presets that start from another base (react, native).
 * Boundary: the only place the oxc option names live; it emits no `design:*` metadata.
 * Runtime: node
 * Governing contract: ADR 0005 (legacy decorators); ADR 0294 (rule R6, decision 17).
 */
import { defineConfig } from "vitest/config";

/** The legacy decorator transform alone, for presets that start from another base (react, native). */
export const decoratorTransform = defineConfig({
  oxc: { decorator: { legacy: true, emitDecoratorMetadata: false } },
});
