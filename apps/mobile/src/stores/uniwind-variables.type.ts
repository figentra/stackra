/**
 * Stackra file contract:
 * Purpose: `UniwindVariables`: the variables pushed into each of Uniwind's themes.
 * Boundary: a type only, in its own file.
 * Runtime: react-native
 * Governing contract: ADR 0320 (the Theme Studio); ADR 0302 (Stackra Design System); ADR 0305 (rule 10).
 */

/** The variables pushed into each of Uniwind's themes. */
export type UniwindVariables = Record<"light" | "dark", Record<string, string | number>>;
