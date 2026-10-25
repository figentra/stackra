/**
 * Stackra file contract:
 * Purpose: `AccessLogSinkFake`, a sink fake that records every write and can be told to fail, for testing that a call
 *          survives a sink outage.
 * Boundary: built on the `Fake` base of @stackra/testing over the abstract port, so a testing module's
 *           `.override(AccessLogSink, fake)` accepts it. A failing write throws `AccessLogWriteFailedError` after it is
 *           recorded, as a real sink does when its store is down; `AccessLogService` swallows it, so no caller is
 *           refused. It chains nothing: tests of the chain use the memory driver.
 * Runtime: isomorphic
 * Governing contract: ADR 0269 (decisions 2 and 3: a package's own fakes in `./testing`); ADR 0266 (decision 2).
 */
import { Fake } from "@stackra/testing";

import { AccessLogSink } from "#contracts/ports/access-log-sink.port";
import type { AccessRecord } from "#contracts/types/access-record.type";
import { AccessLogWriteFailedError } from "#core/errors/access-log-write-failed.error";

/**
 * Records writes; throws on each one when built failing.
 *
 * @example
 * const app = await createTestingModule(AccessLogModule)
 *   .override(AccessLogSink, AccessLogSinkFake.with({ failing: true }))
 *   .compile();
 */
export class AccessLogSinkFake extends Fake.of(AccessLogSink) {
  /** Whether every write throws after it is recorded. */
  private readonly failing: boolean;

  /** @param failing - when true, every write throws after it is recorded. */
  constructor(failing = false) {
    super();
    this.failing = failing;
  }

  /** A fake that fails every write when `options.failing` is true. */
  static with(options: { readonly failing?: boolean } = {}): AccessLogSinkFake {
    return new AccessLogSinkFake(options.failing ?? false);
  }

  /** Records `record`; throws when built failing. */
  write(record: AccessRecord): Promise<void> {
    this.record("write", record);
    return this.failing
      ? Promise.reject(AccessLogWriteFailedError.create())
      : Promise.resolve(undefined);
  }
}
