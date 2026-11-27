/**
 * Stackra file contract:
 * Purpose: `USAGE`, what `create-stackra --help` prints: the one install line, the two options of its own, and that
 *          every other argument goes to `stackra create`.
 * Boundary: text only; no URL other than the default registry's.
 * Runtime: node
 * Governing contract: ADR 0199 (amendment of 2026-11-27).
 */
import { STACKRA_REGISTRY_DEFAULT } from "#node/constants/stackra-registry-default.constant";

/** The help text. */
export const USAGE = `Create a new Stackra app.

Usage:
  npm create stackra@latest <folder> [-- <stackra create options>]
  pnpm create stackra <folder> [<stackra create options>]

Options of create-stackra itself:
  --registry <url>   The Stackra registry (default: STACKRA_REGISTRY, else ${STACKRA_REGISTRY_DEFAULT})
  --cli <version>    The @stackra/cli version or dist-tag to run (default: latest)
  -h, --help         Show this help

Only @stackra/* comes from the Stackra registry, for this run only: nothing is written to your npm settings, and
every other package comes from your usual registry. Every other argument goes to \`stackra create\`; put
\`-- --help\` after the folder to see its options (--yes, --name, --scope, --edition, --profile, --no-install, ...).`;
