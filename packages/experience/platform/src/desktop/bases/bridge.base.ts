/**
 * Stackra file contract:
 * Purpose: `Bridge`, the kind base of a desktop bridge: `class X extends Bridge({ key, capability })` with a
 *          `handle(input)` method, the only path from the renderer to the Electron main process (ADR 0251 as amended
 *          by 0294). Gen writes the preload allow-list and the main-process dispatch from these classes; nothing that
 *          is not a bridge is exposed. The interface of the same name is its instance side.
 * Boundary: called only (`key` is required). A bridge runs in main, built by the container with its constructor
 *           dependencies (`Lifetime.Request` per call in the generated wiring); main re-checks the sender, the key and
 *           the permission before `handle` runs, and `handle` validates its own input, which comes from the renderer.
 *           A package ships the bridges behind its ports; an app writes `src/bridges/<name>.bridge.ts` only for a
 *           main-process need no package covers.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 14 and 16, as amended); ADR 0251 (decisions 1 to 3); registry A13 (the
 *                     Bridge kind lives in @stackra/platform).
 */
import { createKind } from "@stackra/container";

import type { BridgeOptions } from "#desktop/types/bridge-options.type";

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

/** A bridge instance. */
export type Bridge = BridgeBase;

/**
 * The bridge kind base.
 *
 * @example
 * export class PickFolderBridge extends Bridge({ key: "files.pick_folder", capability: Capability.FilesSave }) {
 *   constructor(files: FileSystem) { ... }
 *   async handle(input: PickFolderInput): Promise<PickFolderOutput> { ... }
 * }
 */
export const Bridge = createKind("bridge", BridgeBase) as (
  options: BridgeOptions,
) => abstract new () => BridgeBase;
