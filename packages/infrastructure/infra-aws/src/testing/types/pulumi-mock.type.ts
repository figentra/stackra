/**
 * Stackra file contract:
 * Purpose: `PulumiMock`, what `mockPulumi` hands a test: the resources registered so far, a wait until registration
 *          settles, and a lookup by type token and name.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0269 (testing helpers in the owner package).
 */
import type { MockedResource } from "#testing/types/mocked-resource.type";

/** A mocked Pulumi engine. */
export type PulumiMock = {
  /** The resources registered so far, in registration order. */
  readonly resources: readonly MockedResource[];
  /** Waits until no new resource registers, then returns them all. */
  settled: () => Promise<readonly MockedResource[]>;
  /**
   * The settled resource named `name` whose type token is `type` or ends in `:<type>` (`BucketPolicy`).
   *
   * @throws Error when none registered.
   */
  find: (type: string, name: string) => Promise<MockedResource>;
};
