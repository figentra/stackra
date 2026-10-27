/**
 * Stackra file contract:
 * Purpose: `MemberGraph`, what one member adds to the system graph: its modules, the services it calls, the
 *          integration events it publishes and consumes (wire names), its tables, the packages it builds on and the
 *          provider drivers it binds. Gen writes it per member as `.stackra/graph.json`; the repo step reads it.
 * Boundary: a type only. Derived by `memberGraphOf` from the IR and the built manifest, never authored. It carries
 *           no repo and no node id: the repo step stamps those (`GraphNode`).
 * Runtime: isomorphic
 * Governing contract: ADR 0452 (decision 1: one graph file per member, from what gen already knows); STA-845.
 */

/** One member's part of the system graph. */
export interface MemberGraph {
  /** The member key (`billing`). */
  readonly member: string;

  /** The package name (`@os/billing`). */
  readonly package: string;

  /** Where the member sits: `package`, `service`, `app` or `worker`. */
  readonly layout: string;

  /** The module keys, sorted. */
  readonly modules: readonly string[];

  /** The service keys it calls through a generated client (injected or imported), sorted. */
  readonly calls: readonly string[];

  /** The integration event wire names it publishes (its own and its hosted packages'), sorted. */
  readonly eventsOut: readonly string[];

  /** The integration event wire names its listeners consume from other services, sorted. */
  readonly eventsIn: readonly string[];

  /** The tables of its models (hosted packages' included), sorted. */
  readonly tables: readonly string[];

  /** The packages it builds on: every `@stackra/*` package and every dependency that commits a manifest, sorted. */
  readonly packages: readonly string[];

  /** Each port it binds, by port key, with its driver candidates (`payments.PaymentGateway`: `stripe`, `tap`). */
  readonly drivers: readonly { readonly port: string; readonly candidates: readonly string[] }[];
}
