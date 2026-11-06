/**
 * Stackra file contract:
 * Purpose: `emitBlueprintMacros`, the merged `Blueprint` augmentation of a service's own macros: one
 *          `.stackra/gen/blueprint.ts` declaring `interface Blueprint { <method>: (...args) => ColumnGroup }` per macro,
 *          typed from the macro's `apply` parameters after the blueprint, so `t.retention("kept_until")` type-checks.
 * Boundary: pure: the macro class names and their `#modules/...` paths in, one file out (none for no macro). A
 *           package's macros ship their own augmentation, which its built `./node` carries, so they are not listed.
 * Runtime: isomorphic
 * Governing contract: ADR 0159 as amended by ADR 0305 (a macro is `<Name>Macro`, the method its lower camel stem).
 */
import { GENERATED_NOTICE } from "#core/constants/generated-notice.constant";
import type { GeneratedFile } from "#core/types/generated-file.type";
import type { OwnMacro } from "#core/types/own-macro.type";

/**
 * The augmentation file of `macros`, or none.
 *
 * @example
 * emitBlueprintMacros([{ name: "RetentionMacro", from: "#modules/compliance/database/macros/retention.macro" }]);
 */
export function emitBlueprintMacros(macros: readonly OwnMacro[]): GeneratedFile[] {
  if (macros.length === 0) return [];
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts a copy built here; toSorted is ES2023 and the base lib is ES2022
  const sorted = [...macros].sort((a, b) => (a.name < b.name ? -1 : 1));
  const imports = sorted.map((macro) => `import type { ${macro.name} } from "${macro.from}";\n`);
  const members = sorted.map((macro) => {
    const stem = macro.name.slice(0, -"Macro".length);
    return `    ${stem.charAt(0).toLowerCase()}${stem.slice(1)}: (...args: MacroArgs<${macro.name}>) => ColumnGroup;\n`;
  });
  return [
    {
      path: ".stackra/gen/blueprint.ts",
      content:
        `// ${GENERATED_NOTICE}\n` +
        `import type { ColumnGroup } from "@stackra/database";\n${imports.join("")}\n` +
        "/** The parameters of a macro's `apply` after the blueprint. */\n" +
        "type MacroArgs<M> = M extends { apply(t: never, ...args: infer A): ColumnGroup } ? A : never;\n\n" +
        `declare module "@stackra/database" {\n  interface Blueprint {\n${members.join("")}  }\n}\n`,
    },
  ];
}
