/**
 * Stackra file contract:
 * Purpose: hold `draw-landing-art.mjs` to its contract: the three committed drawings are exactly what the generator
 *          writes; each has a `<title>`, no `<text>`, no colour literal and a `min-width`; champagne stays out of the
 *          monitor; the engine's beam-S bends sit at 1.5 T outside and 0.5 T inside, with only the four butt-end creases.
 * Boundary: calls the exported functions and reads `assets/landing/art/`; writes nothing.
 * Runtime: node
 * Governing contract: ADR 0022 (tests live in tests folders); STA-2041 (build spec §2).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { ART_DIR, beamS, drawings } from "../draw-landing-art.mjs";

const art = drawings();

test("draws the three files, and the committed ones are what it draws", () => {
  assert.deepEqual(Object.keys(art), ["engine", "stack", "monitor"]);
  for (const [name, svg] of Object.entries(art)) {
    assert.equal(
      readFileSync(join(ART_DIR, `${name}.svg`), "utf8"),
      svg,
      `${name}.svg is stale: rerun the script`,
    );
  }
});

test("each drawing is titled, wordless, token-coloured and has a minimum width", () => {
  for (const [name, svg] of Object.entries(art)) {
    assert.match(svg, new RegExp(`<title id="${name}-title">[^<]+</title>`), name);
    assert.doesNotMatch(svg, /<text\b/, name);
    assert.doesNotMatch(svg, /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch)\(/i, name);
    assert.doesNotMatch(svg, /\b(?:fill|stroke)="/, name);
    assert.match(svg, /style="min-width: \d+px"/, name);
  }
});

test("the monitor uses no champagne outside the shared defs and style", () => {
  const body = art.monitor.slice(art.monitor.indexOf("</style>"));
  assert.doesNotMatch(body, /core/);
});

test("the beam-S bends are 1.5 T outside and 0.5 T inside, and only its ends are creases", () => {
  const T = 20;
  const { outline, bends } = beamS(300, T, 52);
  assert.equal(bends.length, 4);
  for (const bend of bends) {
    const at = (r) =>
      outline.filter((q) => Math.abs(Math.hypot(q.x - bend.x, q.z - bend.z) - r) < 1e-9).length;
    assert.equal(at(1.5 * T), 9);
    assert.equal(at(0.5 * T), 9);
  }
  assert.equal(outline.filter((q) => q.isCrease).length, 4);
  const xs = outline.map((q) => q.x);
  assert.deepEqual([Math.min(...xs), Math.max(...xs)], [0, 300]);
});
