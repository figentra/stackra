/**
 * Stackra file contract:
 * Purpose: `checkModelScope`, the gen check `model_tenancy_missing`: in a service that runs `@stackra/tenancy`, every
 *          own model is owned (a `SCOPE_OWNER_TRAITS` trait, so its table gets the owner column and row-level
 *          security) or global by design (`Model.global(...)`). A model that is neither has no row-level security.
 * Boundary: pure. A model extending another own model takes its base's answer; one extending a package's model is
 *           the package's to answer and is skipped. Packages and members without `@stackra/tenancy` are not checked:
 *           a package's platform tables follow their own ADRs, and a member without tenancy cannot declare an owner.
 * Runtime: isomorphic
 * Governing contract: ADR 0239 (decision 1); ADR 0210 (2026-10-24 amendment: `Model.global` documents this refusal).
 */
import { SCOPE_OWNER_TRAITS } from "#core/constants/scope-owner-traits.constant";
import type { DeclaredClass } from "#core/types/declared-class.type";
import type { GenError } from "#core/types/gen-error.type";
import type { MemberIR } from "#core/types/member-ir.type";

/**
 * The refusals of the owner check.
 *
 * @example
 * checkModelScope(serviceIr).map((error) => error.code); // ["model_tenancy_missing"]
 */
export function checkModelScope(ir: MemberIR): GenError[] {
  if (ir.layout !== "service" || !(ir.packages ?? []).includes("@stackra/tenancy")) return [];
  const models = ir.classes.filter((declared) => declared.kind === "model");
  /** Whether a model, or the own model it extends, is owned or global; undefined when a package decides. */
  const answered = (declared: DeclaredClass, seen: ReadonlySet<string>): boolean | undefined => {
    if (declared.global === true) return true;
    if (declared.traits.some((trait) => SCOPE_OWNER_TRAITS.includes(trait.name))) return true;
    if (declared.base === undefined) return false;
    if (!declared.base.own || seen.has(declared.base.name)) return undefined;
    const base = models.find((model) => model.name === declared.base?.name);
    return base === undefined ? undefined : answered(base, new Set([...seen, declared.name]));
  };
  return models
    .filter((declared) => answered(declared, new Set()) === false)
    .map((declared) => ({
      code: "model_tenancy_missing",
      file: declared.file,
      line: 0,
      column: 0,
      subject: declared.name,
      message: `${declared.name} is neither owned (BelongsToTenant, BelongsToTenantOrPlatform) nor Model.global, so its table has no row-level security`,
      fix: `add BelongsToTenant to \`Model.with(...)\` of ${declared.name} (and \`t.belongsToTenant()\` to its migration), or extend \`Model.global(...)\` when the table is global by design`,
    }));
}
