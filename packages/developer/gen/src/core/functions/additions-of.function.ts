/**
 * Stackra file contract:
 * Purpose: `additionsOf`, the `additions` manifest section of a member's model additions (ADR 0336): for each
 *          `ModelAddition(Base)` class, its key, class and file, the base model's key and released package, the side
 *          table in the addition module's own schema, the wire key its fields nest under (the module key) and its
 *          field names; and the refusals gen can see from the member and its dependencies' manifests:
 *          `addition_base_source` (the base is imported from source, not a released package),
 *          `addition_target_missing` (no dependency manifest declares the base model) and `addition_key_collision`
 *          (two additions put fields on one base under one wire key).
 * Boundary: pure. The base is matched by class name in the dependencies' `models` sections, from the package the
 *           addition imports it from when that package commits a manifest. The side table is named like a model
 *           table of the addition class (`fashion.product_additions`), so it never meets the base's table or an own
 *           model's. Its migration (the base id as primary key, `t.belongsToTenant()` for the tenant column and
 *           row-level security, ordered `after:` the base's) is the edition's own, as every migration is (ADR 0159).
 * Runtime: isomorphic
 * Governing contract: ADR 0336 (decisions 1, 2, 3 and 6, enforcement), as amended by ADR 0350; ADR 0335 (decision 3:
 *                     the base is consumed as released packages); ADR 0294 (decision 20: model keys and tables).
 */
import { modelKey } from "#core/functions/model-key.function";
import { tableName } from "#core/functions/table-name.function";
import type { AdditionEntry } from "#core/types/addition-entry.type";
import type { GenError } from "#core/types/gen-error.type";
import type { MemberIR } from "#core/types/member-ir.type";

/**
 * The model additions of `ir`, and what is wrong with them.
 *
 * @param ir - the member read by discovery.
 * @returns the manifest entries, sorted by key, and the refusals.
 * @example
 * additionsOf(ir).additions[0];
 * // { key: "fashion.product_addition", base: "catalog.product", table: "fashion.product_additions", wire: "fashion", ... }
 */
export function additionsOf(ir: MemberIR): {
  readonly additions: readonly AdditionEntry[];
  readonly errors: readonly GenError[];
} {
  const additions: AdditionEntry[] = [];
  const errors: GenError[] = [];
  for (const declared of ir.classes.filter((candidate) => candidate.kind === "model_addition")) {
    const fail = (code: string, message: string, fix: string): void => {
      errors.push({
        code,
        file: declared.file,
        line: 0,
        column: 0,
        subject: declared.name,
        message,
        fix,
      });
    };
    const base = declared.partner;
    if (base === undefined) {
      fail(
        "addition_target_missing",
        `${declared.name} names no base model`,
        "write `extends ModelAddition(Base)` with the base product's released model",
      );
      continue;
    }
    if (base.from.startsWith(".") || base.from.startsWith("#")) {
      fail(
        "addition_base_source",
        `${declared.name} imports its base ${base.name} from source (${base.from})`,
        "import the base model from the base product's released client package",
      );
      continue;
    }
    const owners = ir.dependencies.filter(
      (dependency) =>
        dependency.package === base.from || base.from.startsWith(`${dependency.package}/`),
    );
    const model = (owners.length > 0 ? owners : ir.dependencies)
      .flatMap((dependency) => dependency.manifest.models ?? [])
      .find((candidate) => candidate["class"] === base.name);
    if (model === undefined) {
      fail(
        "addition_target_missing",
        `${declared.name} extends ${base.name}, which no released manifest of ${base.from} declares`,
        "build against a base version that has the model, or remove the addition",
      );
      continue;
    }
    const shape = ir.shapes.find(
      (candidate) => candidate.kind === "model_addition" && candidate.name === declared.name,
    );
    additions.push({
      key: modelKey(declared.module, declared.name),
      class: declared.name,
      file: declared.file,
      base: model.key,
      from: base.from,
      table: tableName(declared.module, declared.name),
      wire: declared.module,
      fields: (shape?.fields ?? []).map((field) => field.name),
    });
  }

  // One wire key per base: an own addition against another of this member or of a dependency (another edition's).
  const holders = new Map<string, string>();
  for (const dependency of ir.dependencies)
    for (const entry of (dependency.manifest["additions"] ?? []) as readonly AdditionEntry[])
      holders.set(`${entry.base} ${entry.wire}`, `${entry.key} (${dependency.package})`);
  for (const entry of additions) {
    const slot = `${entry.base} ${entry.wire}`;
    const holder = holders.get(slot);
    if (holder !== undefined)
      errors.push({
        code: "addition_key_collision",
        file: entry.file,
        line: 0,
        column: 0,
        subject: entry.class,
        message: `${entry.key} and ${holder} both nest fields on ${entry.base} under \`${entry.wire}\``,
        fix: "declare one addition per base model in a module, or move one to a module with another key",
      });
    else holders.set(slot, entry.key);
  }
  additions.sort((left, right) => (left.key < right.key ? -1 : left.key > right.key ? 1 : 0));
  return { additions, errors };
}
