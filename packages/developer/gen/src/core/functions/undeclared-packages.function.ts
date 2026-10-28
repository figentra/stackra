/**
 * Stackra file contract:
 * Purpose: `undeclaredPackages`, the refusals for generated files that import a `@stackra/*` package the member does
 *          not declare in package.json (`client_dependency_missing`, `schema_dependency_missing`), or one of the other
 *          packages a caller names (`zod`, which a schemas file imports), so gen never writes a file that fails to
 *          resolve at runtime.
 * Boundary: pure; reads the generated content and `ir.packages`. An IR without `packages` (built by hand) is not
 *           checked, and the member's own package name is always allowed.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 10: a broken run writes nothing); ADR 0003 (each member declares what it
 *                     imports); STA-1293.
 */
import type { GenError } from "#core/types/gen-error.type";
import type { GeneratedFile } from "#core/types/generated-file.type";
import type { MemberIR } from "#core/types/member-ir.type";

/** A static import's package root: `@stackra/clients` of `from "@stackra/clients/contracts"`, `zod` of `"zod/v4"`. */
const PACKAGE_IMPORT = /^import\s(?:[^"]*\sfrom\s)?"((?:@[\w.-]+\/)?[\w.-]+)/gm;

/**
 * One refusal per generated file and undeclared `@stackra/*` package it imports.
 *
 * @param ir - the member read by discovery, with its declared `packages`.
 * @param files - the generated files to check.
 * @param code - the refusal code, such as `client_dependency_missing`.
 * @param also - packages outside `@stackra/*` held to the same rule (`["zod"]` for the schemas files).
 * @example
 * undeclaredPackages(ir, clients.files, "client_dependency_missing");
 * undeclaredPackages(ir, schemas, "schema_dependency_missing", ["zod"]);
 */
export function undeclaredPackages(
  ir: MemberIR,
  files: readonly GeneratedFile[],
  code: string,
  also: readonly string[] = [],
): GenError[] {
  const declared = ir.packages;
  if (declared === undefined) return [];
  const errors: GenError[] = [];
  for (const file of files) {
    const missing = new Set(
      [...file.content.matchAll(PACKAGE_IMPORT)]
        .map((match) => match[1] ?? "")
        .filter((name) => name.startsWith("@stackra/") || also.includes(name))
        .filter((name) => name !== ir.package && !declared.includes(name)),
    );
    // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
    for (const name of [...missing].sort())
      errors.push({
        code,
        file: file.path,
        line: 0,
        column: 0,
        subject: name,
        message: `the generated ${file.path} imports ${name}, which ${ir.package} does not declare`,
        fix: `add "${name}" to the dependencies in package.json`,
      });
  }
  return errors;
}
