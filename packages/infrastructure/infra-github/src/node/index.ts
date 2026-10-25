/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./node` entry of @stackra/infra-github until `stackra gen` writes the entry barrels
 *          (STA-339): the reader of the committed rules and the GitHub slice of the generated Pulumi program.
 * Boundary: names each re-export and declares nothing. Node only: it loads `@pulumi/github`, `@pulumi/pulumi` and
 *           `node:fs`. Imports `.` internals one way (ADR 0294 decision 15); exports none of `.`'s symbols.
 *           `resolveRef` and `rulesetRules` stay internal.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0171 (decision 3).
 */
export { githubStack } from "#node/functions/github-stack.function";
export { readGithubRules } from "#node/functions/read-github-rules.function";
export type { GithubStack } from "#node/types/github-stack.type";
