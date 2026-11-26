/**
 * Stackra file contract:
 * Purpose: `checkCallShape`, the call-shape refusals of one action or query: a query whose permission is L2 or above
 *          with no written reason (`query_above_l1`; a `// reason:` on its `permission` or `key` lets a deliberate
 *          floor stand), a query with `preconditions` (`query_precondition`), an action with `cache`
 *          (`action_cache`), an L3 or L4 action a user can call with no `stepUp` (`step_up_missing`) and a client
 *          write, an action with an endpoint or a tool, with no written `idempotency` (`idempotency_missing`). The
 *          `stepUp: { exempt: "first-factor-enrolment" }` exemption counts as a `stepUp` only on an action listed in
 *          `FIRST_FACTOR_ENROLMENT_ACTIONS`; anywhere else it is `step_up_exemption_unlisted`. `credentials: "ignore"`
 *          is only for an action whose actors are exactly the anonymous one (`credentials_ignore_not_anonymous`).
 * Boundary: pure; reads the class's written options and the risk, endpoint and tool `buildManifest` resolved for it. An
 *           unknown permission (no risk) is `permission_unknown`'s, never `query_above_l1`. A job, event or workflow
 *           caller derives its own key, so an action with neither endpoint nor tool needs no declaration.
 * Runtime: isomorphic
 * Governing contract: ADR 0136 (decision 3 and Enforcement: a client write declares idempotency); ADR 0207 (decision
 *                     1) and ADR 0406 (step-up on L3 and L4 user actions); ADR 0305 (the query `cache` option); the
 *                     http-conventions table (query risk, preconditions); ADR 0294 (decision 22: a refusal carries its
 *                     fix).
 */
import { FIRST_FACTOR_ENROLMENT_ACTIONS } from "#core/constants/first-factor-enrolment-actions.constant";
import type { DeclaredClass } from "#core/types/declared-class.type";
import type { GenError } from "#core/types/gen-error.type";

/** The risk levels a query may not have, and the ones that need step-up from a user. */
const ABOVE_L1: ReadonlySet<string> = new Set(["L2", "L3", "L4"]);
const STEP_UP: ReadonlySet<string> = new Set(["L3", "L4"]);

/**
 * The call-shape refusals of one action or query.
 *
 * @param declared - the action or query class as discovery read it.
 * @param resolved - its risk (undefined when the permission is unknown), and whether it has an endpoint and is a tool.
 * @example
 * checkCallShape(cancel, { risk: "L2", routed: true, tool: true }).map((error) => error.code);
 * // ["idempotency_missing"] when CancelOrderAction writes no `idempotency`
 */
export function checkCallShape(
  declared: DeclaredClass,
  resolved: { readonly risk: string | undefined; readonly routed: boolean; readonly tool: boolean },
): GenError[] {
  const errors: GenError[] = [];
  const refuse = (code: string, message: string, fix: string): void => {
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
  const { options } = declared;
  const risk = resolved.risk;

  if (declared.kind === "query") {
    if (risk !== undefined && ABOVE_L1.has(risk) && typeof options["riskReason"] !== "string")
      refuse(
        "query_above_l1",
        `${declared.name} is a query but its permission is ${risk}, and a query only reads (L0 or L1)`,
        "give the query an L0 or L1 permission, make it an action if it changes state, or, for a deliberate floor, write `// reason: <why it reads at this level>` on its `permission` (or `key`)",
      );
    if (Array.isArray(options["preconditions"]) && options["preconditions"].length > 0)
      refuse(
        "query_precondition",
        `${declared.name} is a query but declares \`preconditions\`, which only an action runs`,
        "remove `preconditions` and refuse inside `handle`, or make it an action",
      );
    return errors;
  }

  if (options["cache"] !== undefined)
    refuse(
      "action_cache",
      `${declared.name} is an action but declares \`cache\`, and an action's answer is never cached`,
      "remove `cache`, or move the read into a query",
    );
  const actors = Array.isArray(options["actors"]) ? options["actors"].map(String) : [];
  if (
    options["credentials"] !== undefined &&
    (options["credentials"] !== "ignore" || actors.length !== 1 || actors[0] !== "anonymous")
  )
    refuse(
      "credentials_ignore_not_anonymous",
      `${declared.name} declares \`credentials: "ignore"\`, which only an action whose actors are exactly [ActorKind.Anonymous] may take`,
      "set `actors: [ActorKind.Anonymous]`, or remove `credentials` so a signed-in caller is refused",
    );
  const stepUp = options["stepUp"];
  if (typeof stepUp === "object" && stepUp !== null) {
    const identity = `${declared.module}.${String(options["key"])}`;
    if (!FIRST_FACTOR_ENROLMENT_ACTIONS.has(identity))
      refuse(
        "step_up_exemption_unlisted",
        `${declared.name} declares a step-up exemption, which only first-factor enrolment actions may take (${[...FIRST_FACTOR_ENROLMENT_ACTIONS].join(", ")})`,
        "declare `stepUp: AssuranceLevel.Aal2`; a new enrolment action is added to FIRST_FACTOR_ENROLMENT_ACTIONS in a reviewed gen change",
      );
  }
  if (
    risk !== undefined &&
    STEP_UP.has(risk) &&
    actors.includes("user") &&
    options["stepUp"] === undefined
  )
    refuse(
      "step_up_missing",
      `${declared.name} is ${risk} and a user can call it, but declares no \`stepUp\``,
      "add `stepUp: AssuranceLevel.Aal2` (it applies to user callers only)",
    );
  if ((resolved.routed || resolved.tool) && options["idempotency"] === undefined)
    refuse(
      "idempotency_missing",
      `${declared.name} can be called by a client (${resolved.routed ? "it has an endpoint" : "it is a tool"}) but declares no \`idempotency\``,
      "write `idempotency: Idempotency.Optional` (the default), `Idempotency.Required`, `Idempotency.Derived` or `Idempotency.Never`",
    );
  return errors;
}
