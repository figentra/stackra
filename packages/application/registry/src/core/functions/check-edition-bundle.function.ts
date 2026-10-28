/**
 * Stackra file contract:
 * Purpose: `checkEditionBundle(bundle, base)`, the registry's check of an edition's bundle before it lists the edition:
 *          the base resolves to released modules, every bundled module is one of them, and no edition module takes a
 *          base module's key.
 * Boundary: pure and deterministic: issues in code-unit order of the module key. Never throws on untrusted input. The
 *           caller resolves the bundle's `edition.version` range to the base's released manifests (the registry owns
 *           the semver resolution) and passes their modules; an empty list means no release matches. Packs and role
 *           presets are data records the seeding service checks, not modules, so they are not read here.
 * Runtime: isomorphic
 * Governing contract: ADR 0335 (decisions 2, 5 and 6, enforcement); ADR 0349 (an edition's module keys are checked
 *                     against the base's released manifests before publish).
 */
import type { EditionBundle } from "#core/schemas/edition-bundle.schema";
import type { EditionBundleIssue } from "#core/types/edition-bundle-issue.type";

/** Code-unit order, never locale order. */
const byModule = (left: EditionBundleIssue, right: EditionBundleIssue): number =>
  left.module < right.module ? -1 : left.module > right.module ? 1 : 0;

/**
 * The issues of `bundle` against the modules of its base's released manifests.
 *
 * @param bundle - the edition's bundle.
 * @param base - the modules the base's manifests in the bundle's version range declare.
 * @returns the issues; empty when the registry may list the edition.
 * @example
 * checkEditionBundle(bundle, [{ key: "catalog" }, { key: "orders" }]); // []
 */
export function checkEditionBundle(
  bundle: Pick<EditionBundle, "edition" | "modules" | "bundles">,
  base: readonly { readonly key: string }[],
): readonly EditionBundleIssue[] {
  if (base.length === 0)
    return [
      {
        code: "base_unknown",
        module: bundle.edition.of,
        message: `no released manifest of "${bundle.edition.of}" matches "${bundle.edition.version}"`,
      },
    ];
  const known = new Set(base.map((module) => module.key));
  const issues: EditionBundleIssue[] = [];
  for (const key of new Set(bundle.bundles))
    if (!known.has(key))
      issues.push({
        code: "bundled_module_unknown",
        module: key,
        message: `"${key}" is bundled but no released manifest of "${bundle.edition.of}" declares it`,
      });
  for (const key of new Set(bundle.modules))
    if (known.has(key))
      issues.push({
        code: "module_key_taken",
        module: key,
        message: `the edition module "${key}" takes a module key of its base "${bundle.edition.of}"`,
      });
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
  return issues.sort(byModule);
}
