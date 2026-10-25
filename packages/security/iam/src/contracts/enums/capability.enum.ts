/**
 * Stackra file contract:
 * Purpose: `Capability`, what a record visibility rule lets its audience do with a matching record: see it, list it,
 *          buy or use it, or only learn that it exists (an existence-only hit behind an ethical wall).
 * Boundary: an `Enum.of` value plus the type of the same name. Codes are snake_case and stored in saved rules, so a
 *           code never changes. A capability is not a permission: visibility narrows which records a principal meets,
 *           and never grants a permission (ADR 0333 consequences).
 * Runtime: isomorphic
 * Governing contract: ADR 0333 (decision 2); ADR 0294 (decision 16: `Enum.of`); ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/** The three capabilities of ADR 0333, and existence-only hits. */
export const Capability = Enum.of({
  /** Open the record's detail. */
  See: "see",
  /** Meet the record in a list or a search. */
  List: "list",
  /** Buy the record or use it (a product, a course, a document). */
  Use: "use",
  /** Learn only that the record exists (an id and a kind in a search or a conflict check), never its fields. */
  Exists: "exists",
});

/** One of the codes above. */
export type Capability = Enum.Value<typeof Capability>;
