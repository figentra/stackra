/**
 * Stackra file contract:
 * Purpose: `schemaModules`, the module keys that get a schemas file (`#stackra/schemas/<module>`): every module with a
 *          shape, an enum, an action, a query or a config, sorted, when the member has something to
 *          register; none when it has not.
 * Boundary: pure. `generateMember` writes one file per key, and the registrations, the test setup and the entry
 *           barrels load the same files, so all read the one list. A member has something to register when one of its
 *           shapes does not already ship its own `X$` (a file of the member exports that name) or it declares a change
 *           class; enums, configs, actions and queries alone register nothing, so such a member (most enum-only
 *           packages) gets no file and never imports zod. When a member has one, every module keeps its file, so a
 *           reference across modules always resolves.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: the shape compiler); registry v3.1 gap G1.
 */
import type { MemberIR } from "#core/types/member-ir.type";

/**
 * The modules of `ir` that have a schemas file.
 *
 * @example
 * schemaModules(ir); // ["commerce", "orders"]
 */
export function schemaModules(ir: MemberIR): string[] {
  const shipped = new Set(ir.files.flatMap((file) => file.names.map((entry) => entry.name)));
  const registers =
    ir.shapes.some((shape) => !shipped.has(`${shape.name}$`)) ||
    ir.classes.some((declared) => declared.kind === "change" && declared.partner !== undefined);
  if (!registers) return [];
  return [
    ...new Set([
      ...ir.shapes.map((shape) => shape.module),
      ...ir.enums.map((declaration) => declaration.module),
      ...ir.classes
        .filter(
          (declared) =>
            declared.kind === "action" || declared.kind === "query" || declared.kind === "config",
        )
        .map((declared) => declared.module),
    ]),
    // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
  ].sort();
}
