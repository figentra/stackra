/**
 * Stackra file contract:
 * Purpose: `ApiSymbol`, one exported name of a package entry point: its kind, its declaration
 *          without bodies or comments, its TSDoc, its documented members and where it is declared.
 * Boundary: data only; `ApiReader` fills it and the page renderer reads it.
 * Runtime: node
 * Governing contract: ADR 0007 (docblock standard); STA-2857.
 */
import type { ApiDoc } from "#scripts/api-reference/api-doc.type";
import type { ApiMember } from "#scripts/api-reference/api-member.type";
import type { ApiSymbolKind } from "#scripts/api-reference/api-symbol-kind.type";

/** One exported name of an entry point. */
export interface ApiSymbol {
  /** The exported name (the alias, when the entry renames it). */
  readonly name: string;
  /** What the name is. */
  readonly kind: ApiSymbolKind;
  /** The declaration as TypeScript, without comments or bodies; empty for a `reexport`. */
  readonly signature: string;
  /** The TSDoc of the declaration. */
  readonly doc: ApiDoc;
  /** The documented members of a class, interface, object type or enum; empty otherwise. */
  readonly members: readonly ApiMember[];
  /** The declaring file relative to the package folder (`src/core/values/money.value.ts`); empty for a `reexport`. */
  readonly file: string;
  /** For a `reexport`, the package that declares the name (`zod`, `@stackra/contracts`). */
  readonly from?: string;
}
