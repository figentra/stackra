/**
 * Stackra file contract:
 * Purpose: `pipelinePorts`, the ports the action pipeline itself requires for what a service declares, as tokens its
 *          wiring reaches, so each gets its driver table from the declared packages' manifests even when no
 *          constructor injects it:
 *          - `EventOutbox` when the service or a package it hosts declares an integration event (`ctx.publish` writes
 *            one), or an own action declares a `meter` or `analytics`;
 *          - `IdempotencyStore` when an own or hosted action is not `Idempotency.Never` (a sent key is honoured by
 *            default);
 *          - `DeviceSequenceStore` for an `offline` action, and `OfflineCapStore` when it has a `cap`;
 *          - `ReviewItemSink` for an action that `accepts` offline documents;
 *          - `StepUpCheck` for an action that declares `stepUp`.
 * Boundary: pure; reads the IR only. A service only, like `replicaReadsPorts`: a package's own wiring is registered by
 *           its tests. A port no declared package ships a table for stays unbound, and the pipeline names the package
 *           to install. Before STA-2573 these ports were bound only where a constructor injected them, so a service
 *           that only published through `ctx.publish` threw "EventOutbox is not bound".
 * Runtime: isomorphic
 * Governing contract: ADR 0263 (gen writes the wiring); ADR 0138 (as amended: the pipeline's steps); STA-2573.
 */
import type { MemberIR } from "#core/types/member-ir.type";
import type { TokenRef } from "#core/types/token-ref.type";

/** A port of `@stackra/actions/contracts`. */
const actionsPort = (name: string): TokenRef => ({
  class: { name, from: "@stackra/actions/contracts" },
});

/** The outbox port `ctx.publish`, meters and analytics write through. */
const EVENT_OUTBOX: TokenRef = {
  class: { name: "EventOutbox", from: "@stackra/events/contracts" },
};

/**
 * The pipeline ports `ir`'s wiring must reach.
 *
 * @param ir - the member read by discovery.
 * @example
 * pipelinePorts(notifyIr).map((port) => port.class.name); // ["EventOutbox", "IdempotencyStore"]
 */
export function pipelinePorts(ir: MemberIR): TokenRef[] {
  if (ir.layout !== "service") return [];
  const actions = ir.classes.filter((declared) => declared.kind === "action");
  const hosted = [
    ...ir.dependencies.map(({ manifest }) => manifest),
    ...(ir.contractsDependencies ?? []).map(({ manifest }) => manifest),
  ].filter((manifest) => manifest.kind !== "app");
  const some = (option: string): boolean =>
    actions.some((declared) => declared.options[option] !== undefined);
  const publishes =
    ir.classes.some((declared) => declared.kind === "integration_event") ||
    hosted.some((manifest) =>
      (manifest.events ?? []).some((event) => event.kind === "integration"),
    ) ||
    some("meter") ||
    some("analytics");
  const keyed =
    actions.some((declared) => declared.options["idempotency"] !== "never") ||
    ir.dependencies.some(({ manifest }) =>
      (manifest.actions ?? []).some((action) => action.kind === "action"),
    );
  const capped = actions.some(
    (declared) =>
      (declared.options["offline"] as { readonly cap?: unknown } | undefined)?.cap !== undefined,
  );
  return [
    ...(publishes ? [EVENT_OUTBOX] : []),
    ...(keyed ? [actionsPort("IdempotencyStore")] : []),
    ...(some("offline") ? [actionsPort("DeviceSequenceStore")] : []),
    ...(capped ? [actionsPort("OfflineCapStore")] : []),
    ...(some("accepts") ? [actionsPort("ReviewItemSink")] : []),
    ...(some("stepUp") ? [actionsPort("StepUpCheck")] : []),
  ];
}
