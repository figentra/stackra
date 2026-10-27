/**
 * Stackra file contract:
 * Purpose: the `memory` driver of the `MentionDirectory` port: a fixed set of known targets, for tests. The container
 *          builds it empty; `MemoryMentionDirectoryDriver.of(targets)` builds one that knows `targets`.
 * Boundary: test code only, so it ships in `./testing`. It ignores the scope and the record: a target is known when the
 *           test added it.
 * Runtime: node
 * Governing contract: ADR 0266 (decision 2: memory driver first); ADR 0269 (decision 3); ADR 0433 (decision 3); ADR 0294
 *                     (constructor parameters are class tokens).
 */
import { Driver } from "@stackra/container";

import { MentionDirectory } from "#contracts/index";
import type { MentionTarget } from "#contracts/index";

/**
 * Known mention targets in process.
 *
 * @example
 * const directory = MemoryMentionDirectoryDriver.of([{ kind: MentionKind.Member, id: "usr_1" }]);
 */
export class MemoryMentionDirectoryDriver extends Driver(MentionDirectory) {
  private readonly known = new Set<string>();

  /**
   * A directory that knows `known`.
   *
   * @param known - the targets that exist.
   */
  static of(known: readonly MentionTarget[]): MemoryMentionDirectoryDriver {
    const directory = new MemoryMentionDirectoryDriver();
    for (const target of known) directory.known.add(`${target.kind}:${target.id ?? ""}`);
    return directory;
  }

  /** The targets among `targets` that this directory does not know. */
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
