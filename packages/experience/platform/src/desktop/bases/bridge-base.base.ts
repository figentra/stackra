/**
 * Stackra file contract:
 * Purpose: `BridgeBase`, the instance side of a desktop bridge: the class `Bridge({ key, capability })` in `bridge.base.ts` hands to `createKind`, so every
 *          `Bridge(...)` class extends it.
 * Boundary: the instance base only; the kind brand is type-only. The called form, its option checks and its key live in
 *           `bridge.base.ts`; the entry exports this class as a type only.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 14 and 16, as amended); ADR 0251 (decisions 1 to 3); ADR 0305 (rules 10 to 13).
 */
/** The instance side every bridge shares; `handle` is abstract, so a bridge implements it without `override`. */
export abstract class BridgeBase {
  /** Type-only kind brand, so a class of another kind cannot stand in for a bridge. */
  declare readonly "~kind": "bridge";

  /**
   * Runs the bridge in main with the renderer's input; the result travels back in the 0140 envelope.
   *
   * @throws a typed refusal or an error; the dispatcher turns either into an error envelope.
   */
  abstract handle(input: never): Promise<unknown>;
}
