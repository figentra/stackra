/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./node` entry of @stackra/infra-identity until `stackra gen` writes the entry
 *          barrels (STA-339): the seed file reader and the identity slice of the generated Pulumi program.
 * Boundary: names each re-export and declares nothing. Node only: it reads files and loads `@pulumi/pulumi` and the
 *           ZITADEL provider. Imports `.` internals one way (ADR 0294 decision 15); exports none of `.`'s symbols.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0171 (decision 3).
 */
export { identityStack } from "#node/functions/identity-stack.function";
export { readIdentitySeed } from "#node/functions/read-identity-seed.function";
export type { IdentityStack } from "#node/types/identity-stack.type";
