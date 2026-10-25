/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./node` entry of @stackra/infra-mobile until `stackra gen` writes the entry
 *          barrels (STA-339): the mobile slice of the generated Pulumi program.
 * Boundary: names each re-export and declares nothing. Node only: it loads `@pulumi/pulumi`. Imports `.` internals
 *           one way (ADR 0294 decision 15); exports none of `.`'s symbols.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0171 (decision 3).
 */
export { mobileStack } from "#node/functions/mobile-stack.function";
