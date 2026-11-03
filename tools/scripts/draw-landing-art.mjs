#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: `node tools/scripts/draw-landing-art.mjs [out-dir]` (STA-2041) draws the landing's three illustrations
 *          (engine, stack, monitor) as isometric SVG line art and writes each as four single-tone mask layers,
 *          `<name>.<tone>.svg` for tone in ground, dots, line, core (default `assets/landing/art/`). A layer is the
 *          whole drawing in painter's order with that tone's paint white and every other paint black, on a
 *          transparent ground, so occlusion is exact; `@stackra/ui`'s `Illustration` stacks the four as luminance
 *          masks over boxes filled with the token roles (ground `--background`, dots `--stk-tile-line`, line
 *          `--accent`, core `--core`). The engine stands on the Stackra beam-S, extruded: its centreline offset by
 *          ±T/2, bends of centreline radius T (outer 1.5 T, inner 0.5 T, `logo/construction.json` `bendRadius.inB`),
 *          each side strip shaded by the way it faces, the front outline in the beam weight, back edges and
 *          silhouettes in the hairline. Line language from the brand kit: hairline to beam 1 : 1.42, round joins;
 *          shading is the kit's ordered dither in the dots tone (rules §40). The only champagne is the engine's core
 *          window (and the stack's core floor); the monitor's cursor is the line tone and its core layer is all black.
 * Boundary: writes the twelve layer files only. The only colour literals are the mask values `#fff` and `#000`
 *           (a layer is a mask, never shown as colour; the page's tokens colour it). No `<title>` (the page's
 *           `Illustration` carries the name) and no text (labels are the page's words, placed beside the
 *           `data-anchor` junctions). The four layers of a drawing share one viewBox; the page keeps a 4-unit dither
 *           cell at 2 CSS px or more (`min-width` of half the viewBox width). Illustrations never mirror in Arabic.
 *           Exit codes: 0 written.
 * Runtime: node
 * Governing contract: STA-2041 (build spec §2, design pass §9: BRAND's review); brand rules §40 and §42.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const COS = Math.cos(Math.PI / 6);
const SIN = 0.5;
const HAIR = 1.1;
const BEAM = 1.56; // the kit's hairline to beam, 1 : 1.42
const ARC_STEPS = 8; // samples per quarter bend; enough that no facet shows at the drawings' sizes

/** The mask layers of every drawing, in the order `Illustration` stacks them. */
export const TONES = ["ground", "dots", "line", "core"];

/** Where the drawings are written when no folder is given. */
export const ART_DIR = fileURLToPath(new URL("../../assets/landing/art/", import.meta.url));

const f1 = (n) => n.toFixed(1);
const pts = (...ps) => ps.map(([a, b]) => `${f1(a)},${f1(b)}`).join(" ");

class Art {
  constructor(name, ox, oy) {
    this.name = name;
    this.ox = ox;
    this.oy = oy;
    this.out = [];
    this.seen = [];
  }

  /** World (x right-back, y left-front, z up) to canvas. */
  p(x, y, z) {
    const q = [this.ox + (x - y) * COS, this.oy + (x + y) * SIN - z];
    this.seen.push(q);
    return q;
  }

  add(s) {
    this.out.push(s);
  }

  box(x, y, z, w, d, h, cls = "") {
    const p = (...a) => this.p(...a);
    const [A, B, C, D] = [
      p(x, y, z + h),
      p(x + w, y, z + h),
      p(x + w, y + d, z + h),
      p(x, y + d, z + h),
    ];
    const [E, F, G] = [p(x + w, y, z), p(x + w, y + d, z), p(x, y + d, z)];
    this.add(`<polygon class="face-top ${cls}" points="${pts(A, B, C, D)}"/>`);
    this.add(`<polygon class="face-right ${cls}" points="${pts(B, E, F, C)}"/>`);
    this.add(`<polygon class="face-left ${cls}" points="${pts(D, C, F, G)}"/>`);
  }

  cylinder(cx, cy, z, r, h, fins = []) {
    const [top, bot] = [this.p(cx, cy, z + h), this.p(cx, cy, z)];
    // A horizontal circle of radius r seen in isometric is an ellipse with these radii.
    const [rx, ry] = [r * Math.SQRT2 * COS, r * Math.SQRT2 * SIN];
    this.add(
      `<path class="face-left" d="M${f1(top[0] - rx)},${f1(top[1])} V${f1(bot[1])} A${f1(rx)},${f1(ry)} 0 0 0 ${f1(top[0] + rx)},${f1(bot[1])} V${f1(top[1])} Z"/>`,
    );
    for (const fin of fins) {
      const q = this.p(cx, cy, z + fin);
      this.add(
        `<path class="hair" d="M${f1(q[0] - rx)},${f1(q[1])} A${f1(rx)},${f1(ry)} 0 0 0 ${f1(q[0] + rx)},${f1(q[1])}"/>`,
      );
    }
    this.add(
      `<ellipse class="face-top" cx="${f1(top[0])}" cy="${f1(top[1])}" rx="${f1(rx)}" ry="${f1(ry)}"/>`,
    );
    this.add(
      `<ellipse class="hair" cx="${f1(top[0])}" cy="${f1(top[1])}" rx="${f1(rx * 0.45)}" ry="${f1(ry * 0.45)}"/>`,
    );
  }

  line(a, b, cls = "hair") {
    this.add(
      `<line class="${cls}" x1="${f1(a[0])}" y1="${f1(a[1])}" x2="${f1(b[0])}" y2="${f1(b[1])}"/>`,
    );
  }

  junction(q, anchor) {
    const extra = anchor ? ` data-anchor="${anchor}"` : "";
    this.add(
      `<rect class="junction"${extra} x="${f1(q[0] - 3.5)}" y="${f1(q[1] - 3.5)}" width="7" height="7"/>`,
    );
  }

  coreWindow(x0, x1, y, z0, z1) {
    const q = pts(this.p(x0, y, z0), this.p(x1, y, z0), this.p(x1, y, z1), this.p(x0, y, z1));
    this.add(`<polygon class="window" points="${q}"/>`);
    this.add(`<polygon class="core-glow" points="${q}"/>`);
    const c = this.p((x0 + x1) / 2, y, (z0 + z1) / 2);
    this.add(`<circle class="core-dot" cx="${f1(c[0])}" cy="${f1(c[1])}" r="5"/>`);
  }

  ticks(w, y, z, step = 20) {
    for (let i = 0; i <= w; i += step) {
      this.line(this.p(i, y, z), this.p(i, y + (i % 100 === 0 ? 9 : 4), z), "hair tick");
    }
  }

  /**
   * A profile in the x–z plane (`beamS`) extruded along y from 0 to `depth`. Only the faces that turn to the viewer
   * are drawn: the side strips in painter's order, each with its back edge, then the front profile. A line runs along
   * y only where the outline has a corner or the surface turns away (a silhouette), never at an arc's samples.
   */
  extrude(outline, depth) {
    const n = outline.length;
    let area = 0;
    for (let i = 0; i < n; i++) {
      const [q, r] = [outline[i], outline[(i + 1) % n]];
      area += q.x * r.z - r.x * q.z;
    }
    const sign = Math.sign(area);
    const edges = outline.map((q, i) => {
      const r = outline[(i + 1) % n];
      const length = Math.hypot(r.x - q.x, r.z - q.z);
      const nx = (sign * (r.z - q.z)) / length;
      const nz = (-sign * (r.x - q.x)) / length;
      return { i, q, r, nx, nz, isVisible: nx + nz > 1e-9 };
    });
    const visible = edges.filter((e) => e.isVisible);
    for (const e of painterOrder(visible)) {
      const { q, r } = e;
      const face = e.nz >= e.nx ? "face-top" : "face-right";
      this.add(
        `<polygon class="strip ${face}" points="${pts(this.p(q.x, 0, q.z), this.p(r.x, 0, r.z), this.p(r.x, depth, r.z), this.p(q.x, depth, q.z))}"/>`,
      );
      this.line(this.p(q.x, 0, q.z), this.p(r.x, 0, r.z));
      const before = edges[(e.i - 1 + n) % n];
      const after = edges[(e.i + 1) % n];
      if (q.isCrease || !before.isVisible) this.line(this.p(q.x, 0, q.z), this.p(q.x, depth, q.z));
      if (r.isCrease || !after.isVisible) this.line(this.p(r.x, 0, r.z), this.p(r.x, depth, r.z));
    }
    const front = outline.map(({ x, z }) => this.p(x, depth, z));
    this.add(`<polygon class="face-left strong" points="${pts(...front)}"/>`);
  }

  /** The four mask layers, by tone. */
  layers() {
    return Object.fromEntries(TONES.map((tone) => [tone, this.svg(tone)]));
  }

  svg(tone) {
    const u = this.name;
    // Mask values: this layer's tone is white, every other paint black.
    const [ground, dots, line, glow] = TONES.map((t) => (t === tone ? "#fff" : "#000"));
    const hasCore = this.out.some((s) => s.includes('class="core-'));
    // The viewBox fits what was drawn, with room for strokes and the junction marks.
    const xs = this.seen.map((q) => q[0]);
    const ys = this.seen.map((q) => q[1]);
    const pad = 28;
    const [x0, y0] = [Math.min(...xs) - pad, Math.min(...ys) - pad];
    const [w, h] = [
      Math.max(...xs) - Math.min(...xs) + 2 * pad,
      Math.max(...ys) - Math.min(...ys) + 2 * pad,
    ];
    // The core pattern and rules are written only where the drawing has a core, so the monitor's core layer is all black.
    const coreDef = hasCore
      ? `\n  <pattern id="${u}-dither-core" width="3" height="3" patternUnits="userSpaceOnUse"><rect width="1.6" height="1.6" class="core-fill"/></pattern>`
      : "";
    const coreRules = hasCore
      ? `\n  .art-${u} .core-glow { fill: url(#${u}-dither-core); stroke: none; }\n  .art-${u} .core-fill, .art-${u} .core-dot { fill: ${glow}; stroke: none; }`
      : "";
    return `<!-- Generated by tools/scripts/draw-landing-art.mjs (STA-2041); never edit by hand. The ${tone} mask layer. -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x0.toFixed(0)} ${y0.toFixed(0)} ${w.toFixed(0)} ${h.toFixed(0)}" class="art art-${u}">
<defs>
  <pattern id="${u}-dither-light" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="4" class="solid"/><rect width="1.4" height="1.4" class="dot"/></pattern>
  <pattern id="${u}-dither-dark" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="4" class="solid"/><rect width="1.4" height="1.4" class="dot"/><rect x="2" y="2" width="1.4" height="1.4" class="dot"/></pattern>${coreDef}
</defs>
<style>
  .art-${u} polygon, .art-${u} path, .art-${u} ellipse { stroke: ${line}; stroke-width: ${HAIR}; stroke-linejoin: round; }
  .art-${u} .face-top { fill: ${ground}; }
  .art-${u} .face-right { fill: url(#${u}-dither-light); }
  .art-${u} .face-left { fill: url(#${u}-dither-dark); }
  .art-${u} .strip { stroke-width: .6; }
  .art-${u} .strip.face-top { stroke: ${ground}; }
  .art-${u} .strip.face-right { stroke: url(#${u}-dither-light); }
  .art-${u} .solid { fill: ${ground}; }
  .art-${u} .dot { fill: ${dots}; }
  .art-${u} .strong { stroke-width: ${BEAM}; }
  .art-${u} .hair { fill: none; stroke: ${line}; stroke-width: ${HAIR}; stroke-linecap: round; }
  .art-${u} .axis { fill: none; stroke: ${line}; stroke-width: ${HAIR}; stroke-dasharray: 3 4; opacity: .7; }
  .art-${u} .tick { opacity: .6; }
  .art-${u} .window { fill: ${ground}; }${coreRules}
  .art-${u} .pipe { fill: none; stroke: ${line}; stroke-width: ${BEAM}; stroke-linejoin: round; }
  .art-${u} .junction { fill: ${ground}; stroke: ${line}; stroke-width: ${HAIR}; }
  .art-${u} .cursor { fill: ${line}; stroke: none; }
  .art-${u} .screen { fill: ${ground}; stroke-width: ${BEAM}; }
</style>
${this.out.join("\n")}
</svg>
`;
  }
}

/** An edge across the view direction (u = x - z) and along it (s = x + z). */
function span(e) {
  const [u1, u2] = [e.q.x - e.q.z, e.r.x - e.r.z];
  return {
    lo: Math.min(u1, u2),
    hi: Math.max(u1, u2),
    u1,
    u2,
    s1: e.q.x + e.q.z,
    s2: e.r.x + e.r.z,
  };
}

/** How far along the view direction a span is at u. */
const along = (s, u) => s.s1 + ((s.s2 - s.s1) * (u - s.u1)) / (s.u2 - s.u1);

const unit = (a, b) => {
  const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
  return [(b[0] - a[0]) / length, (b[1] - a[1]) / length];
};

/**
 * Orders side strips back to front. Seen along the view direction (1, 1) in the profile plane, strip A covers strip B
 * where their spans across that direction overlap and A lies further along it; disjoint segments never form a cycle.
 */
function painterOrder(edges) {
  const spans = edges.map(span);
  const behind = edges.map(() => new Set()); // behind[a]: strips drawn before a
  for (let a = 0; a < edges.length; a++) {
    for (let b = a + 1; b < edges.length; b++) {
      const [A, B] = [spans[a], spans[b]];
      const [lo, hi] = [Math.max(A.lo, B.lo), Math.min(A.hi, B.hi)];
      if (hi - lo < 1e-6) continue;
      const mid = (lo + hi) / 2;
      const diff = along(A, mid) - along(B, mid);
      if (diff > 1e-6) behind[a].add(b);
      else if (diff < -1e-6) behind[b].add(a);
    }
  }
  const order = [];
  const done = new Set();
  while (order.length < edges.length) {
    const next = edges.findIndex(
      (_, k) => !done.has(k) && [...behind[k]].every((b) => done.has(b)),
    );
    if (next === -1) throw new Error("draw-landing-art: the side strips have no painter's order");
    done.add(next);
    order.push(edges[next]);
  }
  return order;
}

/**
 * The beam-S profile in the x–z plane (x across, z up): three floors of thickness T, a left post joining the top two
 * and a right post the bottom two. The centreline runs from the top floor's right end to the bottom floor's left end,
 * each bend an arc of radius T; the outline is that centreline offset by ±T/2, so every bend is 1.5 T outside and
 * 0.5 T inside. The four butt-end corners are the only creases.
 */
export function beamS(width, thickness, gap) {
  const T = thickness;
  const h = T / 2;
  const [zb, zm, zt] = [0, 1, 2].map((k) => h + k * (T + gap));
  const path = [
    [width, zt],
    [h, zt],
    [h, zm],
    [width - h, zm],
    [width - h, zb],
    [0, zb],
  ];
  const samples = [{ x: width, z: zt, tx: -1, tz: 0 }];
  const bends = [];
  for (let i = 1; i < path.length - 1; i++) {
    const [cx, cz] = path[i];
    const din = unit(path[i - 1], path[i]);
    const dout = unit(path[i], path[i + 1]);
    const turn = din[0] * dout[1] - din[1] * dout[0]; // +1 counter-clockwise, -1 clockwise
    const centre = { x: cx + (dout[0] - din[0]) * T, z: cz + (dout[1] - din[1]) * T };
    bends.push(centre);
    const a0 = Math.atan2(cz - din[1] * T - centre.z, cx - din[0] * T - centre.x);
    for (let k = 0; k <= ARC_STEPS; k++) {
      const a = a0 + (turn * (Math.PI / 2) * k) / ARC_STEPS;
      const [c, s] = [Math.cos(a), Math.sin(a)];
      samples.push({ x: centre.x + T * c, z: centre.z + T * s, tx: -turn * s, tz: turn * c });
    }
  }
  samples.push({ x: 0, z: zb, tx: -1, tz: 0 });
  const side = (s) =>
    samples.map(({ x, z, tx, tz }) => ({ x: x - s * h * tz, z: z + s * h * tx, isCrease: false }));
  const outline = [...side(1), ...side(-1).toReversed()];
  for (const k of [0, samples.length - 1, samples.length, outline.length - 1])
    outline[k].isCrease = true;
  return { outline, bends };
}

/** An engine standing on the Stackra mark's three floors. */
function engine() {
  const a = new Art("engine", 320, 200);
  const [W, D, T, GAP] = [300, 210, 20, 52];
  a.extrude(beamS(W, T, GAP).outline, D);
  const top = 3 * T + 2 * GAP;
  const [ex, ey, ew, ed, eh] = [60, 40, 170, 120, 86];
  a.box(ex, ey, top, ew, ed, eh, "strong");
  a.coreWindow(ex + 30, ex + ew - 30, ey + ed, top + 24, top + 62);
  for (let i = 0; i < 3; i++) a.cylinder(ex + 38 + i * 47, ey + 58, top + eh, 16, 34, [11, 21]);
  const [fx, fy, fz, fr] = [ex + ew + 6, ey + ed / 2, top + eh / 2, 34];
  const ring = Array.from({ length: 48 }, (_, k) => {
    const t = (k * Math.PI) / 24;
    return a.p(fx, fy + fr * Math.cos(t), fz + fr * Math.sin(t));
  });
  a.add(`<polygon class="face-top strong" points="${pts(...ring)}"/>`);
  const hub = a.p(fx, fy, fz);
  for (let k = 0; k < 4; k++) {
    const t = (k * Math.PI) / 2 + Math.PI / 4;
    a.line(hub, a.p(fx, fy + fr * 0.82 * Math.cos(t), fz + fr * 0.82 * Math.sin(t)));
  }
  a.add(`<circle class="junction" cx="${f1(hub[0])}" cy="${f1(hub[1])}" r="4"/>`);
  // The pipe leaves from behind the block: it starts where the block's top back edge stops hiding it.
  const m1 = a.p(ex + ew / 2, ey - 20, top + eh - 20);
  const m2 = a.p(ex + ew / 2, ey - 50, top + eh - 20);
  const m3 = a.p(ex + ew / 2, ey - 50, top + eh + 90);
  a.add(
    `<path class="pipe" d="M${f1(m1[0])},${f1(m1[1])} L${f1(m2[0])},${f1(m2[1])} L${f1(m3[0])},${f1(m3[1])}"/>`,
  );
  a.junction(m2);
  a.junction(m3, "pipeline");
  a.ticks(W, D, 0);
  return a.layers();
}

/** The three floors of a Stackra app, pulled apart: contracts, core and surfaces. */
function stack() {
  const a = new Art("stack", 300, 150);
  const [W, D, T] = [280, 200, 20];
  // The same floors, exploded upward along a dashed axis: contracts at the bottom, core in the middle, surfaces on top.
  const [z1, z2, z3] = [0, 120, 240];
  for (const [z, anchor] of [
    [z1, "contracts"],
    [z2, "core"],
    [z3, "surfaces"],
  ]) {
    a.box(0, 0, z, W, D, T, "strong");
    const q = a.p(W, D / 2, z + T / 2);
    a.line(q, [q[0] + 40, q[1]]);
    a.junction([q[0] + 40, q[1]], anchor);
  }
  for (const [x, y] of [
    [0, D],
    [W, D],
    [W, 0],
  ]) {
    a.line(a.p(x, y, z1 + T), a.p(x, y, z2), "axis");
    a.line(a.p(x, y, z2 + T), a.p(x, y, z3), "axis");
  }
  // The core floor carries the engine's glow: a slot on its front face.
  a.coreWindow(W * 0.35, W * 0.65, D, z2 + 5, z2 + T - 5);
  // The surfaces floor holds three frames: web, desktop, phone, as flat panels standing on it.
  for (const [x, w, h] of [
    [24, 88, 52],
    [128, 76, 44],
    [220, 30, 54],
  ]) {
    a.box(x, 60, z3 + T, w, 10, h, "strong");
  }
  a.ticks(W, D, z1);
  return a.layers();
}

/** A display on a stand, showing a terminal session. */
function monitor() {
  const a = new Art("monitor", 300, 170);
  // A flat display on a stand, seen from the front-left; the screen face is the +y face.
  const [mx, my, mw, md, mh, mz] = [40, 120, 300, 14, 190, 70];
  a.box(mx + 120, my - 20, 0, 60, 60, 6, "strong"); // foot
  a.box(mx + 142, my + 2, 6, 16, 10, mz - 6, "strong"); // neck
  a.box(mx, my, mz, mw, md, mh, "strong"); // body
  // The screen: inset on the front face, ground-filled, with hairline lines of output and the steel cursor.
  const sy = my + md;
  const corners = [
    a.p(mx + 12, sy, mz + 12),
    a.p(mx + mw - 12, sy, mz + 12),
    a.p(mx + mw - 12, sy, mz + mh - 12),
    a.p(mx + 12, sy, mz + mh - 12),
  ];
  a.add(`<polygon class="screen" points="${pts(...corners)}"/>`);
  for (const [k, length] of [150, 210, 120, 180, 90].entries()) {
    const z = mz + mh - 34 - k * 22;
    a.line(a.p(mx + 30, sy, z), a.p(mx + 30 + length, sy, z), "hair tick");
  }
  const cursor = [
    a.p(mx + 30, sy, mz + 40),
    a.p(mx + 44, sy, mz + 40),
    a.p(mx + 44, sy, mz + 56),
    a.p(mx + 30, sy, mz + 56),
  ];
  a.add(`<polygon class="cursor" points="${pts(...cursor)}"/>`);
  a.junction(a.p(mx + mw, my + md / 2, mz + mh / 2), "terminal");
  return a.layers();
}

/** The three drawings, by file stem, each as its four mask layers by tone. */
export function drawings() {
  return { engine: engine(), stack: stack(), monitor: monitor() };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const out = process.argv[2] ?? ART_DIR;
  mkdirSync(out, { recursive: true });
  const written = [];
  for (const [name, layers] of Object.entries(drawings())) {
    for (const [tone, svg] of Object.entries(layers)) {
      writeFileSync(join(out, `${name}.${tone}.svg`), svg);
      written.push(`${name}.${tone}.svg`);
    }
  }
  console.log(`${out}: ${written.join(", ")}`);
}
