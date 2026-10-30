/**
 * Stackra file contract:
 * Purpose: `PropsFile`, one `*.props.ts` file of a component folder (`<pkg>/src/<platform>/<slug>/`).
 * Boundary: a type only, in its own file (ADR 0305).
 * Runtime: node
 * Governing contract: showcase redesign spec (2026-10-27) section 7.2.
 */

/** One component props file. */
export interface PropsFile {
  readonly pkg: "ui";
  readonly platform: "react" | "native";
  readonly slug: string;
  readonly file: string;
}
