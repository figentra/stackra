/**
 * Stackra file contract:
 * Purpose: `MemorySettingValueStoreDriver`, a `SettingValueStore` held in memory: for tests (it backs `fakeSettings`),
 *          local runs and a client with no settings service.
 * Boundary: holds one holder per group and node path or user; a target with no node is the root holder (path `""`,
 *           above every node), since memory has no scope session. Reads return copies, each naming its holder; a write
 *           runs the shared lock check against the holders above its own before it changes anything; a remove drops
 *           paths from the target's own holder. Values live as long as the instance.
 * Runtime: isomorphic
 * Governing contract: ADR 0213 (decision 2: the cascade, locks); ADR 0142 (drivers behind a port); ADR 0294 (decision
 *                     16).
 */
import { Driver } from "@stackra/container";

import { SettingValueStore } from "#contracts/index";
import type { SettingLayer, SettingTarget, SettingValue } from "#contracts/index";
import { refuseLockedPaths } from "#core/functions/refuse-locked-paths.function";

/** One holder's values of one group. */
interface Holder {
  /** The group key. */
  readonly group: string;

  /** The node's path, `""` for the root; unused for a user holder. */
  readonly path: string;

  /** The user of a user holder, else `null`. */
  readonly user: string | null;

  /** The stored values by path in the group. */
  readonly values: Record<string, SettingValue>;

  /** The paths it locks for every holder below. */
  readonly locked: Set<string>;
}

/** Whether the node holder at `holder` sits at or above the node at `node`; the root sits above every node. */
const isAtOrAbove = (holder: string, node: string): boolean =>
  holder === "" || node === holder || node.startsWith(`${holder}.`);

/** The depth of a node path; the root is 0. */
const depthOf = (path: string): number => (path === "" ? 0 : path.split(".").length);

/** A holder as a layer, copied, named by its node path or `user:<id>`. */
const layerOf = (holder: Holder): SettingLayer => ({
  values: { ...holder.values },
  locked: [...holder.locked],
  holder: holder.user === null ? holder.path : `user:${holder.user}`,
});

/**
 * Settings values in memory.
 *
 * @example
 * const store = new MemorySettingValueStoreDriver().seed("orders", { acceptingOrders: false });
 * await new SettingsReader(store).get(OrdersSettings); // acceptingOrders: false
 */
export class MemorySettingValueStoreDriver extends Driver(SettingValueStore) {
  /** Every holder, in the order it was first written. */
  private readonly holders: Holder[] = [];

  /**
   * Sets `values` of `group` at the root holder at once, with no lock check: seeds for a test or a local run.
   *
   * @returns this store, to chain.
   */
  seed(group: string, values: Readonly<Record<string, SettingValue>>): this {
    Object.assign(this.holderOf(group, {}).values, values);
    return this;
  }

  /** The layers of `group` that apply at `target`, outermost first. */
  async layers(group: string, target: SettingTarget): Promise<readonly SettingLayer[]> {
    return this.chainOf(group, target).map(layerOf);
  }

  /** Sets each path of `values` in the target's own layer. */
  async write(
    group: string,
    target: SettingTarget,
    values: Readonly<Record<string, SettingValue>>,
    locked?: readonly string[],
  ): Promise<void> {
    const above = this.chainOf(group, target).filter((holder) => !this.isOwn(holder, target));
    refuseLockedPaths(above.map(layerOf), Object.keys(values));
    const holder = this.holderOf(group, target);
    Object.assign(holder.values, values);
    if (locked !== undefined)
      for (const path of Object.keys(values))
        if (locked.includes(path)) holder.locked.add(path);
        else holder.locked.delete(path);
  }

  /** Removes each of `paths` from the target's own layer, so it inherits again. */
  async remove(group: string, target: SettingTarget, paths: readonly string[]): Promise<void> {
    const holder = this.holderOf(group, target);
    for (const path of paths) {
      Reflect.deleteProperty(holder.values, path);
      holder.locked.delete(path);
    }
  }

  /** The holders of `group` that apply at `target`: the node chain from the root down, then the user's. */
  private chainOf(group: string, target: SettingTarget): Holder[] {
    const node = target.scope?.path ?? "";
    const nodes = this.holders
      .filter(
        (holder) =>
          holder.group === group && holder.user === null && isAtOrAbove(holder.path, node),
      )
      // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
      .sort((a, b) => depthOf(a.path) - depthOf(b.path));
    const user =
      target.user === undefined
        ? undefined
        : this.holders.find((holder) => holder.group === group && holder.user === target.user);
    return user === undefined ? nodes : [...nodes, user];
  }

  /** Whether `holder` is the target's own: its user's, else its node's. */
  private isOwn(holder: Holder, target: SettingTarget): boolean {
    return target.user === undefined
      ? holder.user === null && holder.path === (target.scope?.path ?? "")
      : holder.user === target.user;
  }

  /** The target's own holder of `group`, added empty when it has none. */
  private holderOf(group: string, target: SettingTarget): Holder {
    const found = this.holders.find(
      (holder) => holder.group === group && this.isOwn(holder, target),
    );
    if (found !== undefined) return found;
    const holder: Holder = {
      group,
      path: target.scope?.path ?? "",
      user: target.user ?? null,
      values: {},
      locked: new Set(),
    };
    this.holders.push(holder);
    return holder;
  }
}
