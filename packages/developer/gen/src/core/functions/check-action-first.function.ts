/**
 * Stackra file contract:
 * Purpose: `checkActionFirst`, ADR 0101's two gen checks. The warning `action_without_workflow`: an action whose
 *          constructor takes a cross-boundary dependency (another service's generated client from
 *          `#stackra/clients/<service>`, a service of a sibling module of the member, or the integrations
 *          `ConnectionStore`) and whose body starts no workflow. The refusal `workflow_without_action`: a controller,
 *          command or listener that takes a workflow class or the `WorkflowRunner` port, or starts a workflow in its
 *          body, since an adapter never reaches a workflow but through an action (or the workflow's `startOn`).
 * Boundary: pure; reads the member's own classes only (their kind, module, constructor tokens and the workflows the
 *           reader saw them start, `DeclaredClass.workflows`). A dependency package's classes are checked when gen
 *           runs on that package. Runs in the full pass beside the other checks, never in the manifest or clients
 *           pass.
 * Runtime: isomorphic
 * Governing contract: ADR 0101 (decisions 1 and 3, Enforcement, and its 0294 note); ADR 0294 (decisions 22 and 26: a
 *                     finding carries its fix); ADR 0308 (the managed client); ADR 0260 (generated clients).
 */
import { CLIENTS_SPECIFIER } from "#core/constants/clients-specifier.constant";
import type { DeclaredClass } from "#core/types/declared-class.type";
import type { GenError } from "#core/types/gen-error.type";
import type { MemberIR } from "#core/types/member-ir.type";
import type { TokenRef } from "#core/types/token-ref.type";

/** The managed client to an external provider (ADR 0308): the one outbound path an action injects. */
const OUTBOUND = { name: "ConnectionStore", from: "@stackra/integrations" };

/** The port behind `ctx.run`; a class other than the pipeline that takes it starts workflows itself. */
const RUNNER = { name: "WorkflowRunner", from: "@stackra/actions/contracts" };

/** The adapter kinds: a raw endpoint, a CLI command and an event reaction. */
const ADAPTER_KINDS: ReadonlySet<string> = new Set(["controller", "command", "listener"]);

/** A workflow class, by its kind suffix (ADR 0294 class names). */
const WORKFLOW_NAME = /Workflow$/;

/** Whether `dep` is the token `ref`. */
const is = (dep: TokenRef, ref: { readonly name: string; readonly from: string }): boolean =>
  dep.class.name === ref.name && dep.class.from === ref.from;

/**
 * ADR 0101's findings over `ir`: `action_without_workflow` warnings and `workflow_without_action` refusals.
 *
 * @example
 * checkActionFirst(ir).map((error) => `${error.severity ?? "error"} ${error.code}`);
 * // ["warning action_without_workflow"]
 */
export function checkActionFirst(ir: MemberIR): GenError[] {
  /** The cross-boundary dependencies of `declared`, as printed names. */
  const crossing = (declared: DeclaredClass): string[] =>
    declared.deps.flatMap((dep) => {
      if (dep.class.from.startsWith(CLIENTS_SPECIFIER) || is(dep, OUTBOUND))
        return [`${dep.class.name} (${dep.class.from})`];
      const own = ir.classes.find(
        (candidate) => candidate.name === dep.class.name && candidate.importPath === dep.class.from,
      );
      return own?.kind === "service" && own.module !== declared.module
        ? [`${own.name} (module ${own.module})`]
        : [];
    });

  return ir.classes.flatMap((declared): GenError[] => {
    if (declared.kind === "action") {
      const reaches = crossing(declared);
      if (reaches.length === 0 || (declared.workflows ?? []).length > 0) return [];
      return [
        {
          code: "action_without_workflow",
          file: declared.file,
          line: 0,
          column: 0,
          subject: declared.name,
          message: `${declared.name} reaches past its module (${reaches.join(", ")}) but starts no workflow`,
          fix: "move the cross-boundary work into a workflow and start it with `ctx.run(XWorkflow, input)`, so a later failure can compensate (ADR 0101 decision 3)",
          severity: "warning",
        },
      ];
    }
    if (!ADAPTER_KINDS.has(declared.kind)) return [];
    const reaches = [
      ...declared.deps
        .filter((dep) => is(dep, RUNNER) || WORKFLOW_NAME.test(dep.class.name))
        .map((dep) => dep.class.name),
      ...(declared.workflows ?? []).map((name) => `run(${name})`),
    ];
    return reaches.length === 0
      ? []
      : [
          {
            code: "workflow_without_action",
            file: declared.file,
            line: 0,
            column: 0,
            subject: declared.name,
            message: `${declared.name} is a ${declared.kind}, an adapter, and reaches a workflow directly (${reaches.join(", ")})`,
            fix: "call an action that starts the workflow with `ctx.run(XWorkflow, input)`, or, for an event, set the workflow's `startOn` (ADR 0101 decision 1)",
          },
        ];
  });
}
