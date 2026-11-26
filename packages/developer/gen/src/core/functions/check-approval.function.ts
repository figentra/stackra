/**
 * Stackra file contract:
 * Purpose: `checkApproval`, the gen refusals of the approval stage (STA-1724 FR-002, FR-003): `approval_not_constant`,
 *          `approval_on_query`, an `expiresAfter` above 30 days (`approval_window_too_long`), an actor kind outside
 *          `User`, `Agent` and `ExternalAgent` (`approval_actor_not_allowed`, an allow-list), an input with a
 *          `credential` field (`approval_credential_input`), any `ApprovalCondition` constructor dependency
 *          (`approval_condition_dependency`) and a condition `reads` key that is not a setting marked `approval`
 *          (`approval_condition_reads_unmarked`).
 * Boundary: pure; reads the member's own action, query and condition classes, their input shapes and the `@Setting`
 *           facets of its settings classes. A key that no settings class of the member declares reads as unmarked
 *           (the safer reading). Runs in the full pass beside the other checks, never in the manifest pass.
 * Runtime: isomorphic
 * Governing contract: ADR 0509 (the approval stage); STA-1724 FR-002 and FR-003; ADR 0494 (credential data class);
 *                     ADR 0294 (decision 22: a refusal carries its fix).
 */
import { Duration } from "@stackra/contracts";

import { settingsKeyOf } from "#core/functions/settings-key-of.function";
import type { DeclaredClass } from "#core/types/declared-class.type";
import type { GenError } from "#core/types/gen-error.type";
import type { MemberIR } from "#core/types/member-ir.type";

/** The actor kinds an approval may gate, as the options reader evaluates `ActorKind`. */
const ALLOWED_ACTORS: ReadonlySet<string> = new Set(["user", "agent", "external_agent"]);

/** The longest approval window: 30 days (ADR 0509, L-03). */
const MAX_WINDOW_MS = Duration.toMilliseconds(Duration.days(30));

/** Whether a `@Setting` `approval` option asks for one: `true` (four-eyes) or `{ by: role }` (role-gated). */
const needsApproval = (approval: unknown): boolean =>
  approval === true || (typeof approval === "object" && approval !== null);

/** The setting keys marked `approval`, as `<group>.<section.>name`. */
function approvalKeys(ir: MemberIR): ReadonlySet<string> {
  const keys = new Set<string>();
  const marked = (owner: { name: string; module: string }, member: string): boolean =>
    ir.classes
      .find((declared) => declared.name === owner.name && declared.module === owner.module)
      ?.facets.some(
        (facet) =>
          facet.name === "Setting" &&
          facet.target === "field" &&
          facet.member === member &&
          typeof facet.options === "object" &&
          facet.options !== null &&
          needsApproval((facet.options as Record<string, unknown>)["approval"]),
      ) === true;
  for (const shape of ir.shapes.filter((candidate) => candidate.kind === "settings"))
    for (const field of shape.fields) {
      if (field.type.kind !== "schema") {
        if (marked(shape, field.name)) keys.add(`${settingsKeyOf(shape)}.${field.name}`);
        continue;
      }
      const { name, module } = field.type;
      const section = ir.shapes.find((c) => c.name === name && c.module === module);
      for (const inner of section?.fields ?? [])
        if (marked(shape, field.name) || marked({ name, module }, inner.name))
          keys.add(`${settingsKeyOf(shape)}.${field.name}.${inner.name}`);
    }
  return keys;
}

/** Whether the shape `name` of `module`, or a schema it holds, has a `credential` field. */
function hasCredential(
  ir: MemberIR,
  name: string | undefined,
  module: string,
  seen: Set<string> = new Set(),
): boolean {
  const shape = ir.shapes.find((c) => c.name === name && c.module === module);
  if (shape === undefined || seen.has(`${module}.${shape.name}`)) return false;
  seen.add(`${module}.${shape.name}`);
  return shape.fields.some(
    (field) =>
      field.classified === "credential" ||
      (field.type.kind === "schema" && hasCredential(ir, field.type.name, field.type.module, seen)),
  );
}

/** The window of `expiresAfter` in milliseconds, or undefined when it is absent or not a duration. */
function windowOf(text: unknown): number | undefined {
  if (typeof text !== "string") return undefined;
  try {
    return Duration.toMilliseconds(Duration.parse(text));
  } catch {
    return undefined;
  }
}

/**
 * The approval refusals of `ir`.
 *
 * @example
 * checkApproval(ir).map((error) => error.code); // ["approval_on_query"]
 */
export function checkApproval(ir: MemberIR): GenError[] {
  const errors: GenError[] = [];
  const refuse = (declared: DeclaredClass, code: string, message: string, fix: string): void => {
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

  for (const declared of ir.classes) {
    if (declared.options["approvalNotConstant"] === true) {
      refuse(
        declared,
        "approval_not_constant",
        `${declared.name} declares an approval option gen cannot read as a constant, so its checks could not run`,
        "write `approval` as `true` or an object of constants and class references",
      );
      continue;
    }
    const approval = declared.options["approval"];
    if (approval === undefined || approval === false) continue;
    if (declared.kind === "query") {
      refuse(
        declared,
        "approval_on_query",
        `${declared.name} is a query but declares approval, and a query changes nothing to approve`,
        "remove `approval`, or make it an action",
      );
      continue;
    }
    if (declared.kind !== "action") continue;

    const actors = declared.options["actors"];
    const others = Array.isArray(actors)
      ? actors.filter((actor) => typeof actor !== "string" || !ALLOWED_ACTORS.has(actor))
      : ["(not constant)"];
    if (others.length > 0)
      refuse(
        declared,
        "approval_actor_not_allowed",
        `${declared.name} declares approval for actor kind ${others.map(String).join(", ")}, which an approval may not gate`,
        "limit `actors` to ActorKind.User, ActorKind.Agent and ActorKind.ExternalAgent, or remove `approval`",
      );

    const window =
      typeof approval === "object" && approval !== null
        ? (approval as Record<string, unknown>)["expiresAfter"]
        : undefined;
    const ms = windowOf(window);
    if (ms !== undefined && ms > MAX_WINDOW_MS)
      refuse(
        declared,
        "approval_window_too_long",
        `${declared.name} declares expiresAfter ${JSON.stringify(window)}, above the 30 day maximum`,
        'write an `expiresAfter` of at most "720h"',
      );

    if (hasCredential(ir, declared.handle?.input, declared.module))
      refuse(
        declared,
        "approval_credential_input",
        `${declared.name} declares approval but its input has a credential field, and a parked request would keep the secret`,
        "take the credential out of the input (a connection id), or remove `approval`",
      );
  }

  const marked = approvalKeys(ir);
  for (const declared of ir.classes.filter((c) => c.kind === "approval_condition")) {
    // An allow-list opens here when platform plan and entitlement values exist; the reader arrives as an argument.
    if (declared.deps.length > 0)
      refuse(
        declared,
        "approval_condition_dependency",
        `${declared.name} takes ${declared.deps.map((dep) => dep.class.name).join(", ")}, but a condition takes no constructor dependency`,
        "remove the constructor; `needed` receives the limited settings reader as its third argument",
      );

    const reads = [...(declared.statics["reads"]?.matchAll(/["'`]([^"'`]+)["'`]/g) ?? [])].map(
      (match) => match[1] ?? "",
    );
    const unmarked = reads.filter((key) => !marked.has(key));
    if (unmarked.length > 0)
      refuse(
        declared,
        "approval_condition_reads_unmarked",
        `${declared.name} reads ${unmarked.join(", ")}, which is not a setting marked approval, so a threshold could be lowered without a second person`,
        "mark each key `@Setting({ approval: true })`, or read another key",
      );
  }
  return errors;
}
