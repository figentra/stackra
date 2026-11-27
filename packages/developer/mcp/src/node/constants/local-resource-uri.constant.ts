/**
 * Stackra file contract:
 * Purpose: `LOCAL_RESOURCE_URI`, the `stackra://` URIs of the local MCP's resources: the guidelines, every manifest,
 *          and the prefixes of one member's manifest, one rule and one skill (the name follows the prefix).
 * Boundary: data only; `listLocalResources`, `readLocalResource` and the prompts share it, so a listed URI always
 *           reads.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5); STA-2919.
 */

/** The local resource URIs and URI prefixes. */
export const LOCAL_RESOURCE_URI = {
  /** The conventions every change follows. */
  guidelines: "stackra://guidelines",
  /** Every member's committed manifest, as one JSON array. */
  manifest: "stackra://manifest",
  /** One member's manifest: the prefix, then the URI-encoded member key. */
  manifestOf: "stackra://manifest/",
  /** One rule: the prefix, then its name. */
  rule: "stackra://rules/",
  /** One skill: the prefix, then its name. */
  skill: "stackra://skills/",
} as const;
