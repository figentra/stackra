/**
 * Stackra file contract:
 * Purpose: `YamlKeyTree`, the mapping keys of a block-style YAML document as a tree, each key with the keys under it;
 *          what `yamlKeyTree` returns.
 * Boundary: a type only.
 * Runtime: node
 * Governing contract: ADR 0296 (runway v3); STA-1727.
 */

/** A mapping's keys, each with the keys under it. */
export type YamlKeyTree = ReadonlyMap<string, YamlKeyTree>;
