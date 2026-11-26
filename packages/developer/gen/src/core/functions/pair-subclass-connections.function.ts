/**
 * Stackra file contract:
 * Purpose: `pairSubclassConnections`, the partner of a Connection that extends another Connection
 *          (`class RegionalConnection extends BaseConnection`): the member's Integration of the same stem
 *          (`RegionalIntegration`) when there is one, otherwise its base's partner, so the manifest gives that
 *          Integration its connection and `registerConnections` registers the pair.
 * Boundary: pure, over the classes discovery read. A connection typed directly (`Connection<XIntegration>`) keeps
 *           its partner. Two same-stem Integrations in the member are `connection_partner_ambiguous`.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rule 5: partners); ADR 0308 (rules 15 and 16: an Integration and its connection).
 */
import type { DeclaredClass } from "#core/types/declared-class.type";
import type { GenError } from "#core/types/gen-error.type";

/**
 * The classes with each subclassed connection paired, and the refusals.
 *
 * @example
 * pairSubclassConnections(ir.classes).classes.find((c) => c.name === "RegionalConnection")?.partner?.name;
 * // "RegionalIntegration"
 */
export function pairSubclassConnections(classes: readonly DeclaredClass[]): {
  readonly classes: readonly DeclaredClass[];
  readonly errors: readonly GenError[];
} {
  const errors: GenError[] = [];
  const resolved = new Map<DeclaredClass, DeclaredClass["partner"]>();
  const partnerOf = (declared: DeclaredClass): DeclaredClass["partner"] => {
    const base = declared.base;
    if (base === undefined) return declared.partner;
    if (resolved.has(declared)) return resolved.get(declared);
    const stem = `${declared.name.replace(/Connection$/, "")}Integration`;
    const matches = classes.filter(
      (candidate) => candidate.kind === "integration" && candidate.name === stem,
    );
    if (matches.length > 1)
      errors.push({
        code: "connection_partner_ambiguous",
        file: declared.file,
        line: 0,
        column: 0,
        subject: declared.name,
        message: `${declared.name} extends ${base.name}, and ${matches.length} integrations are named ${stem} (${matches.map((match) => match.file).join(", ")})`,
        fix: `keep one ${stem} in the member, or rename the connection after the integration it serves`,
      });
    const parent = classes.find(
      (candidate) =>
        candidate.kind === "connection" &&
        candidate.name === base.name &&
        candidate.importPath === base.from,
    );
    const match = matches.length === 1 ? matches[0] : undefined;
    const partner =
      match !== undefined
        ? { name: match.name, kind: "integration", from: match.importPath }
        : parent !== undefined
          ? partnerOf(parent)
          : declared.partner;
    resolved.set(declared, partner);
    return partner;
  };
  return {
    classes: classes.map((declared) => {
      if (declared.kind !== "connection" || declared.base === undefined) return declared;
      const partner = partnerOf(declared);
      return partner === undefined ? declared : { ...declared, partner };
    }),
    errors,
  };
}
