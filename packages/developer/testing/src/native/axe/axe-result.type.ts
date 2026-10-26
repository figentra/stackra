/**
 * Stackra file contract:
 * Purpose: `AxeResult`, what `axe(view)` resolves to: the violations it found, each with its rule, a message naming
 *          the node, and the node itself; `toHaveNoViolations` reads it.
 * Boundary: a type only.
 * Runtime: react-native
 * Governing contract: ADR 0269 (decision 6).
 */
import type { AxeNode } from "#native/axe/axe-node.type";

/** The outcome of one accessibility check. */
export interface AxeResult {
  /** Every violation, in tree order; empty when the tree passes. */
  readonly violations: readonly {
    /** The rule broken: a pressable with no name, an image with no label, a heading with no name. */
    readonly rule: "pressable-name" | "image-alt" | "heading-name";
    /** What is wrong, naming the node. */
    readonly message: string;
    /** The offending node. */
    readonly node: AxeNode;
  }[];
}
