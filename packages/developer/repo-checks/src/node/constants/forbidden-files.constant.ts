/**
 * Stackra file contract:
 * Purpose: `FORBIDDEN_FILES`, files that may not exist, each with the message the test-placement check prints.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0126 (no Storybook).
 */

/** Files that may not exist, with the message the validator prints (ADR 0126: no Storybook). */
export const FORBIDDEN_FILES = Object.freeze([
  {
    name: "stories",
    pattern: /\.stories\.[cm]?[jt]sx?$/,
    hint: "no Storybook; test the component in __tests__/",
    adr: "0126",
  },
]);
