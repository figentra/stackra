/**
 * Stackra file contract:
 * Purpose: `TreeSubscriber`, the ORM subscriber that keeps the `treePath` of a `HasTree` record: on create it writes
 *          the parent's path then the record's id (the id alone for a root), and it refuses a unit-of-work update that
 *          changes `parentId`, since a move must rewrite the whole subtree (`CrudService.move`).
 * Boundary: passed as one of `DatabaseOptions.subscribers`; registering it in the generated boot is gen's (STA-339).
 *           A parent created earlier in the same flush is read from the unit of work; any other is read through the
 *           driver in the flush's transaction, so row-level security hides a parent outside the session's scope and
 *           the create is refused. A model without `HasTree` is untouched. Native writes fire no entity event:
 *           `CrudService` refuses a native write of `treePath` or `parentId` itself.
 * Runtime: node
 * Governing contract: ADR 0321 (`HasTree`); ADR 0096 (decision 4: traits run as ORM subscribers); ADR 0160
 *                     (`ltree`); data-layer gap mo16.
 */
import type { EventArgs, EventSubscriber } from "@mikro-orm/core";

import { isTree } from "#core/functions/is-tree.function";
import { treePath } from "#core/functions/tree-path.function";

/** A `HasTree` record as the subscriber reads it. */
type Node = Record<string, unknown> & { parentId?: string | null; treePath?: string };

/**
 * Keeps tree paths.
 *
 * @example
 * const database = await PostgresDatabaseDriver.connect({ url, subscribers: [new TreeSubscriber()] });
 */
export class TreeSubscriber implements EventSubscriber<object> {
  /**
   * The ORM's `beforeCreate`: writes the record's path from its parent's.
   *
   * @throws TypeError when the parent is not found (or not visible), or the id is not an `ltree` label.
   */
  async beforeCreate(args: EventArgs<object>): Promise<void> {
    if (!isTree(args.meta.class)) return;
    const [key = "id"] = args.meta.primaryKeys;
    const node = args.entity as Node;
    const id = String(node[key]);
    const parentId = node.parentId ?? null;
    node.treePath = treePath(
      parentId === null ? undefined : await this.parentPath(args, key, parentId),
      id,
    );
  }

  /**
   * The ORM's `beforeUpdate`.
   *
   * @throws TypeError when the update changes `parentId`.
   */
  beforeUpdate(args: EventArgs<object>): void {
    if (!isTree(args.meta.class)) return;
    if (args.changeSet?.payload !== undefined && "parentId" in args.changeSet.payload)
      throw new TypeError(
        `${args.meta.className}.parentId changes only through CrudService.move, which moves the subtree with it`,
      );
  }

  /** The path of the parent `parentId`, from this flush or the database. */
  private async parentPath(
    args: EventArgs<object>,
    key: string,
    parentId: string,
  ): Promise<string> {
    for (const pending of args.em.getUnitOfWork().getPersistStack()) {
      const candidate = pending as Node;
      if (
        pending.constructor === args.meta.class &&
        candidate[key] === parentId &&
        candidate.treePath
      )
        return candidate.treePath;
    }
    const row = (await args.em.getDriver().findOne(args.meta.class, { [key]: parentId } as never, {
      ctx: args.em.getTransactionContext(),
    })) as Node | null;
    if (typeof row?.treePath !== "string" || row.treePath === "")
      throw new TypeError(
        `${args.meta.className} ${parentId}, the parent of a new record, was not found`,
      );
    return row.treePath;
  }
}
