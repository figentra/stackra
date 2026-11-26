/**
 * Stackra file contract:
 * Purpose: `AttachmentVisibilityCache`, the short cache the files service keeps in front of its
 *          `AttachmentParentVisibility` answers, so serving a record's many files asks the parent's service once per
 *          actor, not once per file.
 * Boundary: in process only, built with `new` by the files service and handed to `canViewAttachment`. An answer is
 *           kept per parent and per whole actor (kind, id, realm, scope and every `onBehalfOf` step), so one actor's
 *           answer never serves another, for at most 60 seconds (default 30), so a revoked access stops serving within
 *           a minute. A question in flight is shared. A failed question is never kept: its error reaches the caller
 *           and the next call asks again. `forget(parent)` drops every answer about a parent when its visibility
 *           changes. Bounded: the oldest answer leaves first when it is full. Holds ids and booleans only; never logs
 *           or lists an entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0222 (files); ADR 0333 (2026-10-24 amendment: a record under a related record is visible
 *                     only when that record is); STA-1960.
 */
import { SystemClockDriver } from "@stackra/container";
import type { Actor, Clock } from "@stackra/contracts";

import type { AttachmentParent } from "#core/types/attachment-parent.type";
import type { AttachmentVisibilityCacheOptions } from "#core/types/attachment-visibility-cache-options.type";

/** The longest an answer may be reused, in milliseconds. */
const MAX_TTL_MS = 60_000;

/** One kept answer and when it stops being served. */
interface Entry {
  readonly visible: Promise<boolean>;
  readonly expiresAt: number;
}

/** The actor and everyone it acts for, as plain values. */
function chainOf(actor: Actor): readonly (string | null)[][] {
  const chain: (string | null)[][] = [];
  for (let step: Actor | undefined = actor; step !== undefined; step = step.onBehalfOf)
    chain.push([step.kind, step.id, step.realm ?? null, step.scopeId ?? null]);
  return chain;
}

/** The start every entry key about `parent` shares: the parent pair, still open for the actor. */
function parentPrefix(parent: AttachmentParent): string {
  return `${JSON.stringify([parent.model, parent.id]).slice(0, -1)},`;
}

/**
 * A short, bounded cache of "can this actor view this attachment's parent" answers.
 *
 * @example
 * const parents = new AttachmentVisibilityCache({ ttlMs: 15_000 });
 * await canViewAttachment(visibility, file.parent, actor, parents); // asks the parent's service
 * await canViewAttachment(visibility, file.parent, actor, parents); // answered from the cache
 * parents.forget(file.parent); // the parent's visibility changed
 */
export class AttachmentVisibilityCache {
  /** The kept answers, oldest first (a `Map` keeps insertion order). */
  private readonly entries = new Map<string, Entry>();

  /** How long an answer is reused, in milliseconds. */
  private readonly ttlMs: number;

  /** The most answers kept. */
  private readonly maxEntries: number;

  /** The clock expiry is read from. */
  private readonly clock: Clock;

  /**
   * @param options - the time to keep an answer, the size and the clock.
   * @throws RangeError when `ttlMs` is not above 0 and at most 60 000, or `maxEntries` is not a positive integer.
   */
  constructor(options: AttachmentVisibilityCacheOptions = {}) {
    const { ttlMs = 30_000, maxEntries = 10_000, clock = new SystemClockDriver() } = options;
    if (!(ttlMs > 0 && ttlMs <= MAX_TTL_MS))
      throw new RangeError(
        `An attachment parent's answer is kept above 0 and at most ${MAX_TTL_MS} ms, got ${ttlMs}`,
      );
    if (!Number.isInteger(maxEntries) || maxEntries < 1)
      throw new RangeError(
        `The attachment visibility cache keeps a positive whole number of answers, got ${maxEntries}`,
      );
    this.ttlMs = ttlMs;
    this.maxEntries = maxEntries;
    this.clock = clock;
  }

  /**
   * The kept answer for `actor` and `parent` while it lasts, else `ask()`'s, then kept.
   *
   * @param parent - the record the file is attached to.
   * @param actor - the verified caller; the whole delegation chain is part of the key.
   * @param ask - asks the parent's service; only a literal `true` counts as visible.
   * @returns whether the actor can view the parent.
   */
  answer(parent: AttachmentParent, actor: Actor, ask: () => Promise<boolean>): Promise<boolean> {
    const key = `${parentPrefix(parent)}${JSON.stringify(chainOf(actor))}]`;
    const now = this.clock.now().getTime();
    const kept = this.entries.get(key);
    this.entries.delete(key);
    if (kept !== undefined && kept.expiresAt > now) {
      this.entries.set(key, kept);
      return kept.visible;
    }
    const visible = ask().then((answer) => answer === true);
    const entry: Entry = { visible, expiresAt: now + this.ttlMs };
    this.entries.set(key, entry);
    // A failed question is never served again.
    visible.catch(() => {
      if (this.entries.get(key) === entry) this.entries.delete(key);
    });
    while (this.entries.size > this.maxEntries) {
      const [oldest] = this.entries.keys();
      if (oldest === undefined) break;
      this.entries.delete(oldest);
    }
    return visible;
  }

  /**
   * Drops every kept answer about `parent`, for every actor: call it when the parent's visibility changes.
   *
   * @param parent - the record whose answers go.
   */
  forget(parent: AttachmentParent): void {
    const prefix = parentPrefix(parent);
    for (const key of this.entries.keys()) if (key.startsWith(prefix)) this.entries.delete(key);
  }
}
