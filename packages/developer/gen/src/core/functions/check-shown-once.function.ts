/**
 * Stackra file contract:
 * Purpose: `checkShownOnce`, the warning `secret_output_kept`: an action whose output may be kept for an idempotent
 *          replay (any `idempotency` but `Idempotency.Never`) returns a field named like a secret (`signingSecret`,
 *          `apiKey`, `clientSecret`, `accessToken`, `password`, `privateKey`) that is neither `@ShownOnce` nor `@Hidden`,
 *          so the idempotency store would keep the plain secret for up to 24 hours (STA-2568).
 * Boundary: pure; reads the member's own action classes, their `idempotency` option and their output shape's top-level
 *           fields. A name heuristic, so it warns and never refuses. A query is never stored, so it is not checked.
 * Runtime: isomorphic
 * Governing contract: ADR 0136 (decision 3); ADR 0294 (decision 22: a finding carries its fix); STA-340 (warnings).
 */
import type { GenError } from "#core/types/gen-error.type";
import type { MemberIR } from "#core/types/member-ir.type";

/** A field name that reads as a credential. */
const SECRET_NAME = /(?:secret|password|privatekey|apikey|accesstoken|refreshtoken|credential)$/i;

/**
 * The `secret_output_kept` warnings of `ir`.
 *
 * @example
 * checkShownOnce(ir).map((error) => error.code); // ["secret_output_kept"]
 */
export function checkShownOnce(ir: MemberIR): GenError[] {
  return ir.classes
    .filter((declared) => declared.kind === "action" && declared.options["idempotency"] !== "never")
    .flatMap((declared) => {
      const output = ir.shapes.find(
        (shape) => shape.name === declared.handle?.output && shape.module === declared.module,
      );
      return (output?.fields ?? [])
        .filter((field) => SECRET_NAME.test(field.name) && !field.shownOnce && !field.hidden)
        .map((field) => ({
          code: "secret_output_kept",
          file: declared.file,
          line: 0,
          column: 0,
          subject: declared.name,
          severity: "warning" as const,
          message: `${declared.name} returns ${output?.name}.${field.name}, which reads as a secret, and the idempotency store keeps its output for a replay`,
          fix: `mark the field \`@ShownOnce\` (a replay then omits it with \`secretOmitted: true\`), or declare \`idempotency: Idempotency.Never\` when a retry may safely run twice`,
        }));
    });
}
