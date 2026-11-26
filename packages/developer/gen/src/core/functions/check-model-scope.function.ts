/**
 * Stackra file contract:
 * Purpose: `checkModelScope`, the gen checks `model_tenancy_missing` and `model_tenancy_migration_missing`: in a
 *          package, and in a service that runs `@stackra/tenancy`, every own model is owned (a `SCOPE_OWNER_TRAITS`
 *          trait, so its table gets the owner column and row-level security) or global by design (`Model.global(...)`),
 *          unless an ADR names its table (`MODEL_SCOPE_EXEMPTIONS`); and an owned model's table gets
 *          `t.belongsToTenant(...)` in some migration of the member that touches it.
 * Boundary: pure. A model extending another own model takes its base's answer; one extending a package's model is
 *           the package's to answer and is skipped. A member without `@stackra/tenancy` other than a package is not
 *           checked: it cannot declare an owner. A package's findings are errors, as a service's are (the tenancy
 *           contract step, ADR 0239); a service's `model_tenancy_migration_missing` is staged (`STAGED_REFUSAL_CODES`). The migration check judges only a
 *           table some migration of the member creates or alters (`ir.migrationTables`), matched by module and name.
 * Runtime: isomorphic
 * Governing contract: ADR 0239 (decision 1); ADR 0210 (2026-10-24 amendment: `Model.global` documents this refusal;
 *                     gen refuses a model that declares neither); tenancy audit 2026-11-07.
 */
import { MODEL_SCOPE_EXEMPTIONS } from "#core/constants/model-scope-exemptions.constant";
import { SCOPE_OWNER_TRAITS } from "#core/constants/scope-owner-traits.constant";
import { tableName } from "#core/functions/table-name.function";
import type { DeclaredClass } from "#core/types/declared-class.type";
import type { GenError } from "#core/types/gen-error.type";
import type { MemberIR } from "#core/types/member-ir.type";

/** Whether a model carries an owner trait itself. */
const isOwned = (declared: DeclaredClass): boolean =>
  declared.traits.some((trait) => SCOPE_OWNER_TRAITS.includes(trait.name));

/**
 * The findings of the owner check.
 *
 * @example
 * checkModelScope(serviceIr).map((error) => error.code); // ["model_tenancy_missing"]
 */
export function checkModelScope(ir: MemberIR): GenError[] {
  const isPackage = ir.layout === "package";
  if (!isPackage && (ir.layout !== "service" || !(ir.packages ?? []).includes("@stackra/tenancy")))
    return [];
  const models = ir.classes.filter((declared) => declared.kind === "model");
  /** Whether a model, or the own model it extends, is owned or global; undefined when a package decides. */
  const answered = (declared: DeclaredClass, seen: ReadonlySet<string>): boolean | undefined => {
    if (declared.global === true || isOwned(declared)) return true;
    if (declared.base === undefined) return false;
    if (!declared.base.own || seen.has(declared.base.name)) return undefined;
    const base = models.find((model) => model.name === declared.base?.name);
    return base === undefined ? undefined : answered(base, new Set([...seen, declared.name]));
  };
  const missing: GenError[] = models
    .filter(
      (declared) =>
        answered(declared, new Set()) === false &&
        !MODEL_SCOPE_EXEMPTIONS.has(tableName(declared.module, declared.name)),
    )
    .map((declared) => ({
      code: "model_tenancy_missing",
      file: declared.file,
      line: 0,
      column: 0,
      subject: declared.name,
      message: `${declared.name} is neither owned (BelongsToTenant, BelongsToTenantOrPlatform) nor Model.global, so its table has no row-level security`,
      fix: `add BelongsToTenant to \`Model.with(...)\` of ${declared.name} (and \`t.belongsToTenant()\` to its migration), or extend \`Model.global(...)\` when the table is global by design`,
    }));
  const unmigrated: GenError[] = models.filter(isOwned).flatMap((declared) => {
    const table = tableName(declared.module, declared.name);
    const bare = table.slice(table.indexOf(".") + 1);
    const blocks = (ir.migrationTables ?? []).filter(
      (block) => block.module === declared.module && block.table === bare,
    );
    if (blocks.length === 0 || blocks.some((block) => block.ownerColumn)) return [];
    return [
      {
        code: "model_tenancy_migration_missing",
        file: declared.file,
        line: 0,
        column: 0,
        subject: declared.name,
        message: `${declared.name} is owned, but no migration of ${table} (${blocks.map((block) => block.file).join(", ")}) calls \`t.belongsToTenant()\`, so the table has no tenant column or policy`,
        fix: `add a migration whose up() is \`schema.table(${JSON.stringify(bare)}, (t) => t.belongsToTenant())\` (\`t.belongsToTenant({ nullable: true })\` for BelongsToTenantOrPlatform), with a backfill of tenant_id`,
      },
    ];
  });
  return [...missing, ...unmigrated];
}
