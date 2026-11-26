/**
 * Stackra file contract:
 * Purpose: hold `draw-landing-art.mjs` to its contract: the twelve committed mask layers (three drawings by four
 *          tones) are exactly what the generator writes; the four layers of a drawing share one viewBox; a layer has no
 *          `<title>`, no `<text>` and no colour other than the mask values `#fff` and `#000`; the line layer keeps the
 *          `data-anchor` junctions; champagne stays out of the monitor (its core layer has no white); the engine's
 *          beam-S bends sit at 1.5 T outside and 0.5 T inside, with only the four butt-end creases.
 * Boundary: calls the exported functions and reads `assets/landing/art/`; writes nothing.
 * Runtime: node
 * Governing contract: ADR 0022 (tests live in tests folders); STA-2041 (build spec §2, the art decision).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { ART_DIR, TONES, beamS, drawings } from "../draw-landing-art.mjs";

const art = drawings();
const layers = Object.entries(art).flatMap(([name, byTone]) =>
  TONES.map((tone) => [`${name}.${tone}`, byTone[tone]]),
);

test("draws twelve layers, and the committed files are exactly what it draws", () => {
  assert.deepEqual(Object.keys(art), ["engine", "stack", "monitor"]);
  assert.deepEqual(TONES, ["ground", "dots", "line", "core"]);
  assert.deepEqual(
    readdirSync(ART_DIR).toSorted(),
    layers.map(([file]) => `${file}.svg`).toSorted(),
  );
  for (const [file, svg] of layers) {
    assert.equal(
      readFileSync(join(ART_DIR, `${file}.svg`), "utf8"),
      svg,
      `${file}.svg is stale: rerun the script`,
    );
  }
});

test("the four layers of a drawing share one viewBox", () => {
  for (const [name, byTone] of Object.entries(art)) {
    const boxes = TONES.map((tone) => byTone[tone].match(/viewBox="([^"]+)"/)?.[1]);
    assert.ok(boxes[0], name);
    assert.equal(new Set(boxes).size, 1, name);
  }
});

test("each layer is a wordless mask: no title, no text, only white and black", () => {
  for (const [file, svg] of layers) {
    assert.doesNotMatch(svg, /<title\b/, file);
    assert.doesNotMatch(svg, /<text\b/, file);
    assert.doesNotMatch(svg, /\b(?:rgba?|hsla?|oklch|oklab|lab|lch|var)\(/i, file);
    for (const [hex] of svg.matchAll(/#[0-9a-f]{3,8}\b/gi)) {
      assert.match(hex, /^#(?:fff|000)$/, file);
    }
  }
});

test("the line layer keeps the junction anchors", () => {
  assert.match(art.engine.line, /data-anchor="pipeline"/);
  for (const anchor of ["contracts", "core", "surfaces"]) {
    assert.match(art.stack.line, new RegExp(`data-anchor="${anchor}"`));
  }
  assert.match(art.monitor.line, /data-anchor="terminal"/);
});

test("the monitor has no champagne: its core layer has no white", () => {
  assert.doesNotMatch(art.monitor.core, /#fff/i);
  assert.match(art.engine.core, /#fff/);
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
