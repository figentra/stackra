/**
 * Stackra file contract:
 * Purpose: `MockedResource`, one resource a Pulumi program registered under `mockPulumi`: its type token, its logical
 *          name and the inputs it was given, resolved.
 * Boundary: type only; test data, never sent anywhere.
 * Runtime: node
 * Governing contract: ADR 0269 (testing helpers in the owner package), ADR 0171 (preview only for agents).
 */

/** A registered resource. */
export type MockedResource = {
  /** The type token (`aws:s3/bucket:Bucket`). */
  readonly type: string;
  /** The logical name. */
  readonly name: string;
  /** The resolved inputs. */
  readonly inputs: Readonly<Record<string, unknown>>;
};
