/**
 * Stackra file contract:
 * Purpose: the git tag prefix that marks a schema release, `schemas@<major>.<minor>.<patch>`.
 * Boundary: a constant only; read-schema-releases.ts lists the tags and the deploy workflow triggers on them.
 * Runtime: node
 * Governing contract: ADR 0284 (hosted static files, decision 3).
 */

/**
 * Prefix of a schema release tag. The text after it must be a plain `x.y.z` version; anything else (a pre-release, a
 * typo) fails the build so a published path is never guessed. A tag never moves, which is what makes the versioned
 * paths immutable.
 */
export const SCHEMA_TAG_PREFIX = "schemas@";
