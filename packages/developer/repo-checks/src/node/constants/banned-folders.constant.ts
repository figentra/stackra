/**
 * Stackra file contract:
 * Purpose: `BANNED_FOLDERS`, the folders that may not exist anywhere in a member, each with its reason.
 * Boundary: data only; `isBannedFolder` reads it.
 * Runtime: node
 * Governing contract: ADR 0126 (decision 3); ADR 0130 (decision 4); settlement Q2.3.
 */

/** Folders that may not exist anywhere in a member (ADR 0126 d3, ADR 0130 d4, settlement Q2.3). */
export const BANNED_FOLDERS = Object.freeze([
  {
    name: "controllers",
    reason: "raw endpoints live in raw/ only; actions are the unit",
    adr: "0130",
  },
  { name: "dtos", reason: "Zod schemas replace DTO classes", adr: "0095" },
  { name: "repositories", reason: "MikroORM models and queries replace repositories", adr: "0014" },
  { name: "helpers", reason: "name the kind the code serves instead", adr: "0126" },
  {
    name: "utils",
    reason: "shared pure functions go to @stackra/support or the kind they serve",
    adr: "0126",
  },
  { name: "presentation", reason: "there is no presentation layer folder", adr: "0130" },
]);
