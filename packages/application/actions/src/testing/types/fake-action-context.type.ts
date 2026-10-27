/**
 * Stackra file contract:
 * Purpose: `FakeActionContext`, what `fakeActionContext(...)` returns: a full `ActionContext` plus what the code under
 *          test did with it (the records it authorized, the work it queued after commit, the audit fields it added, the
 *          events it published).
 * Boundary: a type only. A fake context runs no pipeline: `authorize` allows, `afterCommit` work is kept and never run,
 *           and `run`, `signal`, `dispatch` and `replica` reject unless the test passes its own.
 * Runtime: node
 * Governing contract: ADR 0269 (testing helpers); ADR 0136 (consequence: handlers are testable with a fake ctx).
 */
import type { Json } from "@stackra/contracts";
import type { Event } from "@stackra/events";

import type { ActionContext } from "#core/index";

/** An action context for a unit test, with what was done with it. */
export interface FakeActionContext extends ActionContext {
  /** What the code under test did with the context. */
  readonly recorded: {
    /** The records passed to `authorize`, in order. */
    readonly authorized: readonly object[];
    /** The work passed to `afterCommit`, in order, never run. */
    readonly afterCommit: readonly (() => unknown)[];
    /** The fields passed to `audit`, merged. */
    readonly audit: Readonly<Record<string, Json>>;
    /** The events passed to `publish`, in order, never written. */
    readonly published: readonly Event[];
  };
}
