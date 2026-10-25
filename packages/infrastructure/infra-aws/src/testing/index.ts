/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./testing` entry of @stackra/infra-aws until `stackra gen` writes the entry barrels
 *          (STA-339): Pulumi's mocks set up for the infra programs (`mockPulumi`), the output reader (`outputOf`) and
 *          their types, for this package's tests and for a stacks repository testing its composed program.
 * Boundary: names each re-export and declares nothing. Tests only.
 * Runtime: node (tests)
 * Governing contract: ADR 0294 (decision 15); ADR 0269 (testing helpers in the owner package).
 */
export { mockPulumi } from "#testing/functions/mock-pulumi.function";
export { outputOf } from "#testing/functions/output-of.function";
export type { MockedResource } from "#testing/types/mocked-resource.type";
export type { PulumiMock } from "#testing/types/pulumi-mock.type";
