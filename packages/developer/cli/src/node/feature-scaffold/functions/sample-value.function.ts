/**
 * Stackra file contract:
 * Purpose: `sampleValue(field)`, a TypeScript literal that a scaffolded unit test passes for one field: a string as
 *          long as its `min` (at least one character, at most its `max`), a number at its `min` or 1, `true`, or a
 *          fixed date.
 * Boundary: pure; reads the `min` and `max` written in the field's decorators.
 * Runtime: node
 * Governing contract: ADR 0022 (tests); ADR 0294 (rule R4).
 */
import type { FeatureField } from "#node/feature-scaffold/types/feature-field.type";

/**
 * The sample literal of `field`.
 *
 * @example
 * sampleValue({ type: "string", decorators: ["@Str({ min: 3, max: 10 })"] } as FeatureField); // '"xxx"'
 */
export function sampleValue(field: FeatureField): string {
  const written = field.decorators.join(" ");
  const min = Number(/\bmin:\s*(\d+)/.exec(written)?.[1] ?? Number.NaN);
  const max = Number(/\bmax:\s*(\d+)/.exec(written)?.[1] ?? Number.NaN);
  if (field.type === "number") return String(Number.isNaN(min) ? 1 : min);
  if (field.type === "boolean") return "true";
  if (field.type === "Date") return 'new Date("2026-01-02T00:00:00.000Z")';
  const length = Math.max(1, Number.isNaN(min) ? 1 : min);
  return JSON.stringify("x".repeat(Number.isNaN(max) ? length : Math.min(length, max)));
}
