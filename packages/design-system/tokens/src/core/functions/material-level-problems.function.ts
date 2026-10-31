/**
 * Stackra file contract:
 * Purpose: `materialLevelProblems(path, token, problems)`: the checks `defineTheme` runs on a material level's optional
 *          fields: the tint source, a tint from 0 to 0.24, a brightness from 0.5 to 2, the edge and rim shares, a
 *          specular from 0 to 1, the inner depth (px lengths and shares), the elevation, a dim from 0 to 1 and the
 *          vibrancy roles. A field left out is not checked, so a theme written before them still validates.
 * Boundary: pure; it appends to `problems` and returns nothing. The dim floors are not a theme check: the renderer
 *           never draws below them (`GLASS_CLEAR_DIM_FLOORS`).
 * Runtime: isomorphic
 * Governing contract: ADR 0320 (the glass material, as amended 2026-10-31); ADR 0501 (tokens v2, the materials block).
 */
import { MaterialElevation } from "#contracts/enums/material-elevation.enum";
import { MaterialTintSource } from "#contracts/enums/material-tint-source.enum";
import { VibrancyRole } from "#contracts/enums/vibrancy-role.enum";

const PX = /^(?:0|\d+(?:\.\d+)?px)$/;

const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const inRange = (candidate: unknown, low: number, high: number) =>
  typeof candidate === "number" && candidate >= low && candidate <= high;

const isShares = (token: unknown) =>
  isRecord(token) && inRange(token.light, 0, 1) && inRange(token.dark, 0, 1);

/** Appends the problems of `token`'s optional fields, each named under `path`. */
export function materialLevelProblems(
  path: string,
  token: Readonly<Record<string, unknown>>,
  problems: string[],
): void {
  const {
    tintSource,
    tint,
    brightness,
    edge,
    rim,
    specular,
    innerDepth,
    elevation,
    dim,
    vibrancy,
  } = token;
  if (tintSource !== undefined && !MaterialTintSource.includes(tintSource as MaterialTintSource))
    problems.push(`${path}.tintSource is not one of ${MaterialTintSource.join(", ")}`);
  if (tint !== undefined && !inRange(tint, 0, 0.24))
    problems.push(`${path}.tint is not a share from 0 to 0.24`);
  if (brightness !== undefined && !inRange(brightness, 0.5, 2))
    problems.push(`${path}.brightness is not a factor from 0.5 to 2`);
  if (edge !== undefined && !isShares(edge))
    problems.push(`${path}.edge is not a share per scheme`);
  if (rim !== undefined && !isShares(rim)) problems.push(`${path}.rim is not a share per scheme`);
  if (specular !== undefined && !inRange(specular, 0, 1))
    problems.push(`${path}.specular is not a share from 0 to 1`);
  if (
    innerDepth !== undefined &&
    innerDepth !== null &&
    !(
      isRecord(innerDepth) &&
      typeof innerDepth.y === "string" &&
      PX.test(innerDepth.y) &&
      typeof innerDepth.blur === "string" &&
      PX.test(innerDepth.blur) &&
      isShares(innerDepth.alpha)
    )
  )
    problems.push(`${path}.innerDepth is not px lengths and a share per scheme`);
  if (elevation !== undefined && !MaterialElevation.includes(elevation as MaterialElevation))
    problems.push(`${path}.elevation is not one of ${MaterialElevation.join(", ")}`);
  if (dim !== undefined && !inRange(dim, 0, 1))
    problems.push(`${path}.dim is not a share from 0 to 1`);
  if (
    vibrancy !== undefined &&
    !(
      Array.isArray(vibrancy) &&
      vibrancy.every((role) => VibrancyRole.includes(role as VibrancyRole))
    )
  )
    problems.push(`${path}.vibrancy is not a list of ${VibrancyRole.join(", ")}`);
}
