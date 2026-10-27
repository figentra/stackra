/**
 * Stackra file contract:
 * Purpose: `fakeRender`, a test fixture: a deterministic `SvgRenderer` whose bytes encode the width and the SVG length.
 * Boundary: test support only; never imported by package code.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0441 (as amended).
 */
import type { SvgRenderer } from "#contracts/types/svg-renderer.type";

/** A renderer whose bytes are the width and the SVG's length: deterministic and cheap. */
export const fakeRender: SvgRenderer = async (svg, width) =>
  new TextEncoder().encode(`${width}:${svg.length}`);
