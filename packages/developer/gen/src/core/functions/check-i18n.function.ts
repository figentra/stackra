/**
 * Stackra file contract:
 * Purpose: `checkI18n`, the i18n target's refusals: `i18n_namespace_clash` when the member and a declared package (or
 *          two packages) ship the same lang namespace, and `i18n_key_missing` when an `I18n.<namespace>.<path>` chain in
 *          the member's files names a key neither its own catalogues nor a merged package's ship (STA-1298; stackra-167
 *          reuses the code), and when a derived enum label `<module>::enums.<enum>.<code>` is missing from a
 *          base-language locale that ships the module's namespace (STA-1306).
 * Boundary: pure; reads `i18nTree(ir)` and `ir.i18nReferences`. Default applied 2026-10-27 (STA-1309, owner may
 *           override): only runtime `dependencies` count (a devDependency's lang never reaches the runtime, so discovery
 *           leaves it out), and a member may not extend a package's namespace: one namespace has one owner and one
 *           loader set, so a member adds its keys under its own namespace. Nothing is checked for a member that does not declare
 *           `@stackra/i18n` (no `#stackra/i18n` is written). A chain may stop at a branch (`loyalty_tier[tier]`);
 *           segments after a leaf are the string's own members and are not checked.
 * Runtime: isomorphic
 * Governing contract: ADR 0268 (R15: typed keys, every key exists in the base locale); ADR 0294 (decision 22: a refusal
 *                     carries its fix); STA-1298.
 */
import { i18nTree, type I18nNode } from "#core/functions/i18n-tree.function";
import { snakeCase } from "#core/functions/snake-case.function";
import type { GenError } from "#core/types/gen-error.type";
import type { MemberIR } from "#core/types/member-ir.type";

/** Whether `path` names a branch or a leaf under `node`. */
function exists(node: I18nNode, path: readonly string[]): boolean {
  let current: I18nNode = node;
  for (const segment of path) {
    if (Array.isArray(current)) return current.includes(segment);
    const branch = current as { readonly [segment: string]: I18nNode };
    if (segment !== "_" && Object.hasOwn(branch, segment)) current = branch[segment] ?? [];
    else return (branch["_"] as readonly string[] | undefined)?.includes(segment) ?? false;
  }
  return true;
}

/**
 * The i18n refusals of `ir`.
 *
 * @param ir - the member read by discovery, with its catalogues, package catalogues and key references.
 * @example
 * checkI18n(ir).map((error) => error.code); // ["i18n_key_missing"]
 */
export function checkI18n(ir: MemberIR): GenError[] {
  if (ir.packages !== undefined && !ir.packages.includes("@stackra/i18n")) return [];
  const { namespaces, clashes } = i18nTree(ir);
  const errors: GenError[] = clashes.map(({ namespace, owners }) => ({
    code: "i18n_namespace_clash",
    file: `assets/lang/<locale>/${namespace}.json`,
    line: 0,
    column: 0,
    subject: namespace,
    message: `the lang namespace "${namespace}" is shipped by ${owners.join(" and ")}; I18n.${namespace} can name only one`,
    fix: owners.includes(ir.package)
      ? `rename ${ir.package}'s assets/lang/<locale>/${namespace}.json in every locale (and its I18n.${namespace} uses); a package's namespace is its member key`
      : `declare only one of ${owners.join(", ")}, or rename the namespace in one of them`,
  }));
  for (const reference of ir.i18nReferences ?? []) {
    const [namespace = "", ...path] = reference.path;
    const found = namespaces.get(namespace);
    if (found !== undefined && exists(found.node, path)) continue;
    const key = `${namespace}::${path.join(".")}`;
    errors.push({
      code: "i18n_key_missing",
      file: reference.file,
      line: reference.line,
      column: reference.column,
      subject: `I18n.${reference.path.join(".")}`,
      message:
        found === undefined
          ? `no lang namespace "${namespace}": neither ${ir.package}'s assets/lang nor a declared @stackra package ships it`
          : `the key "${key}" is not in ${found.package ?? ir.package}'s assets/lang/${found.base}/${namespace}.json`,
      fix:
        found === undefined
          ? `add assets/lang/<locale>/${namespace}.json, or declare in package.json the @stackra package that ships the "${namespace}" namespace`
          : found.package === undefined
            ? `add "${path.join(".")}" to assets/lang/${found.base}/${namespace}.json (and every other locale), or use a key it has`
            : `use a key ${found.package} ships under I18n.${namespace}, or add "${path.join(".")}" to that package's assets/lang`,
    });
  }
  // Derived keys (ADR 0294 decision 22, STA-1306): each own enum case's label `<module>::enums.<enum>.<code>` is in
  // every base-language locale that ships the module's namespace (a regional overlay holds only what differs).
  for (const [locale, shipped] of Object.entries(ir.catalogues ?? {}).sort(([left], [right]) =>
    left.localeCompare(right),
  )) {
    if (locale.includes("-")) continue;
    for (const enumeration of ir.enums) {
      const catalogue = shipped[enumeration.module];
      if (typeof catalogue !== "object" || catalogue === null) continue;
      const enums = (catalogue as Record<string, unknown>)["enums"];
      const labels = (
        typeof enums === "object" && enums !== null
          ? (enums as Record<string, unknown>)[snakeCase(enumeration.name)]
          : undefined
      ) as Record<string, unknown> | undefined;
      for (const code of enumeration.values) {
        if (typeof labels === "object" && labels !== null && Object.hasOwn(labels, code)) continue;
        const path = `enums.${snakeCase(enumeration.name)}.${code}`;
        errors.push({
          code: "i18n_key_missing",
          file: `assets/lang/${locale}/${enumeration.module}.json`,
          line: 0,
          column: 0,
          subject: `${enumeration.module}::${path}`,
          message: `the derived label of ${enumeration.name}.${code} is not in assets/lang/${locale}/${enumeration.module}.json`,
          fix: `add "${path}" to assets/lang/${locale}/${enumeration.module}.json`,
        });
      }
    }
  }
  return errors;
}
