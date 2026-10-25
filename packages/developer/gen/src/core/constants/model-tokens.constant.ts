/**
 * Stackra file contract:
 * Purpose: `MODEL_TOKENS`, the generic types a constructor may inject per model and how gen turns each into a class
 *          token: `Repository<M>` is `repositoryOf(M)` (no dependency) and `Journal<M>` is `journalOf(M)` (one
 *          dependency, `Locks`). Discovery reads the type; the wiring prints the factory call and binds it once.
 * Boundary: a frozen map keyed by the type's name; a type counts only when declared in the named package.
 * Runtime: isomorphic
 * Governing contract: ADR 0145 and ADR 0263 as amended by ADR 0294 (classes are the only tokens); ADR 0097; ADR 0220
 *                     (the ledger's journal).
 */
import type { ClassRef } from "#core/types/class-ref.type";

/** Type name to the package that declares it, the token factory and the token's constructor dependencies. */
export const MODEL_TOKENS: Readonly<
  Record<
    string,
    { readonly package: string; readonly factory: ClassRef; readonly deps: readonly ClassRef[] }
  >
> = Object.freeze({
  Repository: {
    package: "@stackra/database",
    factory: { name: "repositoryOf", from: "@stackra/database" },
    deps: [],
  },
  Journal: {
    package: "@stackra/ledger",
    factory: { name: "journalOf", from: "@stackra/ledger" },
    deps: [{ name: "Locks", from: "@stackra/locking" }],
  },
});
