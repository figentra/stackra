/**
 * Stackra file contract:
 * Purpose: `AxeNode`, one host node of a rendered React Native tree as `axe` reads it: its host type, its props and its
 *          children, matching the test renderer's instances that `render` returns as `container`.
 * Boundary: a type only, structural, so `axe` imports no renderer and a test may hand it a plain tree.
 * Runtime: react-native (vitest)
 * Governing contract: ADR 0269 (decision 6).
 */

/** A host node and its subtree. */
export interface AxeNode {
  /** The host component (`View`, `Text`, `Image`, `TextInput`). */
  readonly type: string;

  /** The host props (`role`, `accessibilityLabel`, `aria-hidden`, handlers). */
  readonly props: Readonly<Record<string, unknown>>;

  /** The child nodes and text. */
  readonly children: readonly (AxeNode | string)[];
}
