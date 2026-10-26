/**
 * Stackra file contract:
 * Purpose: the `memory` driver of the `MentionDirectory` port: a fixed set of known targets, for tests.
 * Boundary: test code only, so it ships in `./testing`. It ignores the scope and the record: a target is known when the
 *           test added it.
 * Runtime: node
 * Governing contract: ADR 0266 (decision 2: memory driver first); ADR 0269 (decision 3); ADR 0433 (decision 3).
 */
import { Driver } from "@stackra/container";

import { MentionDirectory } from "#contracts/index";
import type { MentionTarget } from "#contracts/index";

/**
 * Known mention targets in process.
 *
 * @example
 * const directory = new MemoryMentionDirectoryDriver([{ kind: MentionKind.Member, id: "usr_1" }]);
 */
export class MemoryMentionDirectoryDriver extends Driver(MentionDirectory) {
  private readonly known: Set<string>;

  /** @param known - the targets that exist. */
  constructor(known: readonly MentionTarget[] = []) {
    super();
    this.known = new Set(known.map((target) => `${target.kind}:${target.id ?? ""}`));
  }

  /** See `MentionDirectory.unknownAmong`. */
  unknownAmong(
    _scope: unknown,
    _record: unknown,
    targets: readonly MentionTarget[],
  ): Promise<readonly MentionTarget[]> {
    return Promise.resolve(
      targets.filter((target) => !this.known.has(`${target.kind}:${target.id ?? ""}`)),
    );
  }
}
