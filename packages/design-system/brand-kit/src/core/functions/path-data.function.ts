/**
 * Stackra file contract:
 * Purpose: `pathData(commands, dx, dy)`, SVG path data from opentype.js path commands, moved by (dx, dy) and rounded
 *          to two decimals, with `-0` written as `0` so the output is stable from run to run.
 * Boundary: pure. opentype.js `getPath()` already answers y-down (SVG) coordinates, so the commands are written here;
 *           `Path#toPathData()` of opentype.js 2 flips Y a second time and can print NaN for near-zero values, so it
 *           is never used.
 * Runtime: isomorphic
 * Governing contract: ADR 0340 decision 10 (the outliner); ported from figentra/os `tools/brand-kit/lib/outline.mjs`
 *                     (ORIGIN.md).
 */

/** One opentype.js path command; a missing coordinate is 0. */
type PathCommand = {
  readonly type: string;
  readonly x?: number;
  readonly y?: number;
  readonly x1?: number;
  readonly y1?: number;
  readonly x2?: number;
  readonly y2?: number;
};

/** `value` rounded to two decimals, never `-0`. */
function round(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return Object.is(rounded, -0) ? "0" : String(rounded);
}

/**
 * The path data of `commands`.
 *
 * @param commands - opentype.js `Path#commands`.
 * @param dx - added to every x.
 * @param dy - added to every y.
 * @example
 * pathData([{ type: "M", x: 0, y: 0 }, { type: "L", x: 1.005, y: -0.001 }, { type: "Z" }]); // "M0 0L1.01 0Z"
 */
export function pathData(commands: readonly PathCommand[], dx = 0, dy = 0): string {
  const x = (value = 0): string => round(value + dx);
  const y = (value = 0): string => round(value + dy);
  return commands
    .map((command) => {
      switch (command.type) {
        case "M":
        case "L":
          return `${command.type}${x(command.x)} ${y(command.y)}`;
        case "Q":
          return `Q${x(command.x1)} ${y(command.y1)} ${x(command.x)} ${y(command.y)}`;
        case "C":
          return `C${x(command.x1)} ${y(command.y1)} ${x(command.x2)} ${y(command.y2)} ${x(command.x)} ${y(command.y)}`;
        default:
          return "Z";
      }
    })
    .join("");
}
