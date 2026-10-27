/**
 * Stackra file contract:
 * Purpose: `PRO_SCOPE`, the npm scope of the Pro packages: no member of figentra/stackra may depend on a name in it.
 * Boundary: data only; `checkMember` reads it.
 * Runtime: node
 * Governing contract: ADR 0461 (decision 3); ADR 0077; ADR 0202; BUILDER-RULES rule 6f.
 */

/**
 * The scope prefix of every Pro package (ADR 0077). Pro packages live in figentra/stackra-pro (ADR 0461) and build on
 * the free ones, so a free member, apps included, never depends on one: the dependency would point the open repository
 * at a restricted registry name.
 */
export const PRO_SCOPE = "@stackra-pro/";
