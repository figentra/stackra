/**
 * Stackra file contract:
 * Purpose: the `MentionDirectory` port: which mention targets do not exist (or are not reachable) in a scope, so a
 *          comment never mentions a member who left, a team of another tenant or a stranger.
 * Boundary: an abstract class that is its own token, keyed `collaboration.MentionDirectory`. The consumer implements it
 *           over its people, teams, roles and the record's participants; the assistant is never asked about. A failing
 *           lookup rejects, so a mention is never accepted unchecked.
 * Runtime: isomorphic
 * Governing contract: ADR 0433 (decision 3); ADR 0294 (decisions 15 and 16); ADR 0263 (ports resolve by type).
 */
import { Port, type ScopeRef } from "@stackra/contracts";

import type { CommentableRef } from "#contracts/types/commentable-ref.type";
import type { MentionTarget } from "#contracts/types/mention-target.type";

/**
 * Checks mention targets.
 *
 * @example
 * export class PeopleMentionDirectoryDriver extends Driver(MentionDirectory) {
 *   async unknownAmong(scope, record, targets) { ... }
 * }
 */
export abstract class MentionDirectory extends Port {
  /** Type-only port key, so `DriverName<MentionDirectory>` narrows to this port's drivers. */
  declare readonly "~key": "collaboration.MentionDirectory";

  /** The targets among `targets` that do not resolve in `scope` for `record` (none of kind `assistant`). */
  abstract unknownAmong(
    scope: ScopeRef,
    record: CommentableRef,
    targets: readonly MentionTarget[],
  ): Promise<readonly MentionTarget[]>;
}
