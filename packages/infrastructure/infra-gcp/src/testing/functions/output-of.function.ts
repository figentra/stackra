/**
 * Stackra file contract:
 * Purpose: `outputOf(output)`, the value a Pulumi output resolves to under `mockPulumi`, as a promise a test awaits.
 * Boundary: tests only; under the mocks every output is known, so the promise always settles.
 * Runtime: node (tests)
 * Governing contract: ADR 0269 (testing helpers in the owner package).
 */
import type * as pulumi from "@pulumi/pulumi";

/**
 * The resolved value.
 *
 * @example
 * expect(await outputOf(foundation.filesBucket!)).toMatch(/files/);
 */
export function outputOf<T>(output: pulumi.Output<T>): Promise<T> {
  return new Promise<T>((resolve) => {
    output.apply((value) => {
      resolve(value);
      return value;
    });
  });
}
