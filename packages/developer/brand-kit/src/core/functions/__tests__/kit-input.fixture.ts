/**
 * Stackra file contract:
 * Purpose: `kitInput`, a test fixture: a `KitInput` with every source the outputs need (or the paths given), the
 *          stackra theme and one store caption set.
 * Boundary: test support only; never imported by package code.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0441 (as amended).
 */
import { STACKRA_THEME } from "@stackra/tokens";

import type { KitInput } from "#contracts/types/kit-input.type";
import { ALL_SOURCES } from "#core/functions/__tests__/all-sources.fixture";

const SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><path d="M0 0h1v1z"/></svg>';

const encode = (text: string) => new TextEncoder().encode(text);

/** A read kit holding `paths` (default: every source). */
export function kitInput(
  paths: readonly string[] = ALL_SOURCES,
  overrides: Partial<KitInput> = {},
): KitInput {
  return {
    kit: {
      id: "acme",
      group: "family",
      status: "proposed",
      name: { en: "Acme" },
      line: { en: "One line." },
    },
    theme: STACKRA_THEME,
    files: [...paths].sort(),
    sources: new Map(paths.map((path) => [path, encode(path.endsWith(".svg") ? SVG : "{}")])),
    fonts: [],
    store: [
      {
        app: "staff",
        locale: "en",
        captions: [{ screen: "stock", text: "One scan away" }],
        screenshots: new Map(),
      },
    ],
    inputHash: "0".repeat(64),
    ...overrides,
  };
}
