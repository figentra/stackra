/**
 * Stackra file contract:
 * Purpose: `validateKitJson`, the rules of `kit.json` (the `BrandKit` shape): a kebab-case id, a group, a known status,
 *          English name and line, and a well-formed parent with a semver version and a known endorsement.
 * Boundary: pure; returns one line per problem and an empty list when the value is a usable kit.
 * Runtime: isomorphic
 * Governing contract: ADR 0441 (as amended).
 */
import { Enum } from "@stackra/contracts";

import { Endorsement } from "#contracts/enums/endorsement.enum";
import { KitStatus } from "#contracts/enums/kit-status.enum";

const KEBAB = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const nonEmpty = (value: unknown): boolean => typeof value === "string" && value.trim() !== "";

/** Problems with one localized text field: an object of strings with `en`. */
function textProblems(field: string, value: unknown): string[] {
  if (!isRecord(value)) return [`kit.json: "${field}" must be an object with "en"`];
  const out = nonEmpty(value.en) ? [] : [`kit.json: "${field}.en" is required`];
  for (const [locale, text] of Object.entries(value))
    if (typeof text !== "string") out.push(`kit.json: "${field}.${locale}" must be a string`);
  return out;
}

/**
 * The problems in a parsed `kit.json`.
 *
 * @example
 * const problems = validateKitJson(JSON.parse(text));
 * if (problems.length) throw new InvalidBrandKitError(problems);
 */
export function validateKitJson(value: unknown): string[] {
  if (!isRecord(value)) return ["kit.json: not a JSON object"];
  const out: string[] = [];
  if (typeof value.id !== "string" || !KEBAB.test(value.id))
    out.push('kit.json: "id" must be kebab-case');
  if (!nonEmpty(value.group)) out.push('kit.json: "group" is required');
  if (!Enum.values(KitStatus).includes(value.status as KitStatus))
    out.push(`kit.json: "status" must be one of ${Enum.values(KitStatus).join(", ")}`);
  out.push(...textProblems("name", value.name), ...textProblems("line", value.line));
  if (value.primary !== undefined && !nonEmpty(value.primary))
    out.push('kit.json: "primary" must be a lockup name');
  if (value.parent !== undefined) {
    const parent = value.parent;
    if (!isRecord(parent)) out.push('kit.json: "parent" must be an object');
    else {
      if (typeof parent.kit !== "string" || !KEBAB.test(parent.kit))
        out.push('kit.json: "parent.kit" must be kebab-case');
      if (typeof parent.version !== "string" || !SEMVER.test(parent.version))
        out.push('kit.json: "parent.version" must be a semver version');
      if (
        parent.endorsement !== undefined &&
        !Enum.values(Endorsement).includes(parent.endorsement as Endorsement)
      )
        out.push(
          `kit.json: "parent.endorsement" must be one of ${Enum.values(Endorsement).join(", ")}`,
        );
    }
  }
  return out;
}
