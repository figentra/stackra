/**
 * Stackra file contract:
 * Purpose: `checkVersionedItems`, the warning `versioned_items_not_applied`: a member on `@stackra/versioning` has an
 *          action or query whose output schema holds a list whose item schema has a dated `Change`, but the generated
 *          adapter downgrades only the top-level output, so that change does not reach the items yet.
 * Boundary: pure; reads the member's action and query classes, their output shapes' top-level array fields and the
 *           dated (`from` is a `YYYY-MM-DD` string) change classes. A member that does not declare the package is not
 *           versioned and is never checked. A warning, never a refusal.
 * Runtime: isomorphic
 * Governing contract: ADR 0118 (decision 2); ADR 0294 (decision 22: a finding carries its fix); STA-340 (warnings);
 *                     STA-2532.
 */
import { declaresPackage } from "#core/functions/declares-package.function";
import type { GenError } from "#core/types/gen-error.type";
import type { MemberIR } from "#core/types/member-ir.type";

/**
 * The `versioned_items_not_applied` warnings of `ir`.
 *
 * @example
 * checkVersionedItems(ir).map((warning) => warning.subject); // ["ListPaymentsQuery"]
 */
export function checkVersionedItems(ir: MemberIR): GenError[] {
  if (!declaresPackage(ir, "@stackra/versioning")) return [];
  const dated = new Set(
    ir.classes
      .filter(
        (declared) => declared.kind === "change" && typeof declared.options["from"] === "string",
      )
      .map((declared) => declared.partner?.name ?? ""),
  );
  return ir.classes
    .filter((declared) => declared.kind === "action" || declared.kind === "query")
    .flatMap((declared) => {
      const output = ir.shapes.find(
        (shape) => shape.name === declared.handle?.output && shape.module === declared.module,
      );
      return (output?.fields ?? []).flatMap((field) => {
        if (field.type.kind !== "array" || field.type.element.kind !== "schema") return [];
        const item = field.type.element;
        const shape = ir.shapes.find(
          (candidate) => candidate.name === item.name && candidate.module === item.module,
        );
        if (shape === undefined || !dated.has(shape.name)) return [];
        return [
          {
            code: "versioned_items_not_applied",
            file: declared.file,
            line: 0,
            column: 0,
            subject: declared.name,
            severity: "warning" as const,
            message: `a Change<${item.name}> on items of ${output?.name}.${field.name} is not applied yet`,
            fix: `only the top-level output is downgraded; move the changed fields to ${output?.name} itself, or keep the items unchanged`,
          },
        ];
      });
    });
}
