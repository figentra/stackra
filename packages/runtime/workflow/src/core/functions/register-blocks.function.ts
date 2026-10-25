/**
 * Stackra file contract:
 * Purpose: `registerBlocks`, how a package (through gen's entry) exposes its capabilities as workflow building blocks:
 *          each trigger event and each action, by its locked key.
 * Boundary: writes the process-wide `BUILDING_BLOCKS`; a later row for a key replaces the earlier one for the same
 *           class. Checks each row, so a wrong row fails at boot: the key's shape, the class's kind matching the
 *           block's kind, a trigger-only `facts`, `read` or `correlate`, and the facts as `@stackra/rules` fields.
 * Runtime: isomorphic
 * Governing contract: ADR 0153 (decision 1: every package exposes building blocks); ADR 0122 (decision 3); ADR 0294
 *                     (decisions 20 and 22).
 */
import { Enum } from "@stackra/contracts";
import { kindOf } from "@stackra/container";
import { Rules } from "@stackra/rules";

import { BUILDING_BLOCKS } from "#core/constants/building-blocks.constant";
import { BlockKind } from "#core/enums/block-kind.enum";
import type { BuildingBlock } from "#core/types/building-block.type";

/** A block key: a module key, then one or more dotted snake_case parts. */
const KEY = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/;

/** The class kinds each block kind takes. */
const CLASS_KINDS: Readonly<Record<BlockKind, readonly string[]>> = {
  [BlockKind.Trigger]: ["domain_event", "integration_event"],
  [BlockKind.Action]: ["action"],
};

/**
 * Registers building blocks.
 *
 * @throws TypeError when a key is not a block key or another class holds it, a kind is not a `BlockKind`, the class is
 *         not of the block's kind, an action carries `facts`, `read` or `correlate`, or a fact field is misdeclared.
 * @example
 * registerBlocks([{ key: "orders.order_paid", kind: BlockKind.Trigger, type: OrderPaid, label: "orders::blocks.paid" }]);
 */
export function registerBlocks(rows: readonly BuildingBlock[]): void {
  for (const row of rows) {
    if (!KEY.test(row.key))
      throw new TypeError(`registerBlocks: "${row.key}" is not a key such as "orders.order_paid"`);
    if (!Enum.values(BlockKind).includes(row.kind))
      throw new TypeError(`registerBlocks: ${row.key} has no BlockKind`);
    if (!CLASS_KINDS[row.kind].includes(kindOf(row.type)?.kind ?? ""))
      throw new TypeError(
        `registerBlocks: ${row.key}'s class ${row.type.name} is not a ${row.kind}`,
      );
    const holder = BUILDING_BLOCKS.get(row.key);
    if (holder !== undefined && holder.type !== row.type)
      throw new TypeError(
        `registerBlocks: ${row.type.name} and ${holder.type.name} share ${row.key}`,
      );
    if (
      row.kind === BlockKind.Action &&
      (row.facts !== undefined || row.read !== undefined || row.correlate !== undefined)
    )
      throw new TypeError(`registerBlocks: ${row.key} is an action; only a trigger has facts`);
    // checks each fact field as the rules engine does, so a misdeclared field fails here
    if (row.facts !== undefined)
      Rules.create({
        key: "workflow.automation",
        sources: [{ key: "trigger", fields: row.facts }],
      });
    BUILDING_BLOCKS.set(row.key, Object.freeze({ ...row }));
  }
}
