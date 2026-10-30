/**
 * Stackra file contract:
 * Purpose: `ApiPart`, the API of one compound part (`Button`, `Tabs.List`).
 * Boundary: a type only, in its own file.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 7.1; ADR 0305 (one declaration per file).
 */
import type { ApiProp } from "#src/types/api-prop.type";

/** The generated API of one part. */
export interface ApiPart {
  /** The part's name, such as "Tabs.List". */
  readonly name: string;
  /** The base it extends, such as "PressableFeedback". */
  readonly extends?: string;
  /** The part's props. */
  readonly props: readonly ApiProp[];
  /** Render props: no Default column. */
  readonly renderProps?: readonly ApiProp[];
  /** The `on*` members. */
  readonly events?: readonly ApiProp[];
  /** Native `<Part>Animation` options. */
  readonly animation?: readonly ApiProp[];
}
