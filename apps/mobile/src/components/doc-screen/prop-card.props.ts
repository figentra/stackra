/**
 * Stackra file contract:
 * Purpose: `PropCardProps`: props of `PropCard`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rule 12).
 */
import type { ApiProp } from "@stackra/showcase";

/** Props of {@link PropCard}. */
export interface PropCardProps {
  /** The generated prop, render prop, event or animation option. */
  readonly prop: ApiProp;
  /** The entry key ("free/button") and part ("Button") the Arabic overlay is keyed by. */
  readonly entryKey: string;
  readonly part: string;
  /** False for a render prop, which has no default. Defaults to true. */
  readonly hasDefault?: boolean;
}
