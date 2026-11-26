/**
 * Stackra file contract:
 * Purpose: `ListActivityQuery`, `activity.activity_entry.list@1`: the caller's tenant's activity feed, newest first,
 *          one cursor page at a time. `GET /activity-entries` by the endpoint convention for a signed-in user, and an
 *          MCP tool for an agent (queries are by default).
 * Boundary: read only, uncached; its permission is `ActivityEntryPermissions.read` (L0). The page is
 *           `CrudService.table`'s keyset read: newest first by the primary key (public ids are minted over UUIDv7), with
 *           the opaque cursor it hands out. The row policy, not a filter here, keeps other tenants' entries out.
 * Runtime: node
 * Governing contract: ADR 0294; ADR 0155 (queries are MCP tools); ADR 0307 (rule 2: the table read); the HTTP
 *                     conventions (cursor pagination).
 */
import { Query, type QueryContext } from "@stackra/actions";
import { ActorKind } from "@stackra/contracts";

import { activityEntryViewOf } from "#modules/activity/functions/activity-entry-view-of.function";
import type { ListActivityInput } from "#modules/activity/schemas/list-activity-input.schema";
import { ListActivityOutput } from "#modules/activity/schemas/list-activity-output.schema";
import type { ActivityEntryService } from "#modules/activity/services/activity-entry.service";

/** Reads one page of the feed through the service's table read. */
export class ListActivityQuery extends Query({
  key: "activity_entry.list",
  actors: [ActorKind.User, ActorKind.Agent],
}) {
  private readonly entries: ActivityEntryService;

  /**
   * @param entries - reads the rows.
   */
  constructor(entries: ActivityEntryService) {
    super();
    this.entries = entries;
  }

  /** The page after `input.cursor` (the first page without one). */
  async handle(input: ListActivityInput, _ctx: QueryContext): Promise<ListActivityOutput> {
    const page = await this.entries.table({
      limit: input.limit,
      ...(input.cursor === undefined ? {} : { cursor: input.cursor }),
    });
    return ListActivityOutput.create({
      items: page.items.map((entry) => activityEntryViewOf(entry)),
      hasMore: page.hasMore,
      ...(page.nextCursor === undefined ? {} : { nextCursor: page.nextCursor }),
    });
  }
}
