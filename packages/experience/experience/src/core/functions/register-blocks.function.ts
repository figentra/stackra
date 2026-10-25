/**
 * Stackra file contract:
 * Purpose: `registerBlocks`, which links each block class to its derived key and to the component that draws it on
 *          this target: the call the generated wiring makes for every block a target can render, from the keys locked
 *          in `stackra.manifest.json`. A block marked `@Renamed(old)` is registered under its old key too, so a
 *          published document that names it still renders.
 * Boundary: writes `BLOCK_ENTRIES`, all or nothing: a bad key, a class that is not a block, a missing component or a key
 *           taken by another class throws and registers none of the batch. Registering a class again under the same
 *           key replaces its entry (a reloaded module).
 * Runtime: isomorphic
 * Governing contract: ADR 0270 (decision 3); ADR 0294 (decisions 20 and 22); ADR 0110 (decision 6).
 */
import { kindOf } from "@stackra/container";
import { Renamed } from "@stackra/validation";

import { BLOCK_ENTRIES } from "#core/constants/block-entries.constant";
import type { BlockEntry } from "#core/types/block-entry.type";

/** `<member>.<name>`, each segment snake_case. */
const BLOCK_KEY = /^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)+$/;

/**
 * Registers each block under its key on this target.
 *
 * @throws RangeError when a key is not `<member>.<name>` in snake_case, or is already another class's.
 * @throws TypeError when a class does not extend `Block({...})` or an entry has no component.
 * @example
 * registerBlocks([
 *   { key: "web.hero_section", block: HeroSectionBlock, component: HeroSection },
 *   { key: "web.testimonials", block: TestimonialsBlock, component: Testimonials },
 * ]);
 */
export function registerBlocks(entries: readonly BlockEntry[]): void {
  const next = new Map(BLOCK_ENTRIES);
  for (const entry of entries) {
    if (!BLOCK_KEY.test(entry.key))
      throw new RangeError(
        `A block key is <member>.<name> in snake_case, got ${JSON.stringify(entry.key)}`,
      );
    if (kindOf(entry.block)?.kind !== "block")
      throw new TypeError(`${entry.block.name} does not extend Block({...})`);
    if (entry.component === undefined || entry.component === null)
      throw new TypeError(`${entry.block.name} (${entry.key}) has no component on this target`);
    const old = Renamed.on(entry.block);
    for (const key of old === undefined ? [entry.key] : [entry.key, old]) {
      const taken = next.get(key);
      if (taken !== undefined && taken.block !== entry.block)
        throw new RangeError(`The block key "${key}" is already ${taken.block.name}'s`);
      next.set(key, entry);
    }
  }
  for (const [key, entry] of next) BLOCK_ENTRIES.set(key, entry);
}
