/**
 * Stackra file contract:
 * Purpose: `PROMOTE_COMMAND`, `stackra promote --to <environment> [--from <environment>] [--sha <sha>] [--dry-run]
 *          [--approved]`: ships what `--from` (default staging) runs to `--to`, which deploys on promotion (STA-607).
 * Boundary: data plus dispatch to `runRunwayPromote`.
 * Runtime: node
 * Governing contract: ADR 0170 (decisions 6 and 10); ADR 0352 (decisions 1 and 3); ADR 0468.
 */
import { runRunwayPromote } from "#node/runway-promote/functions/run-runway-promote.function";
import type { CliCommand } from "#node/types/cli-command.type";

/** The `stackra promote` command definition. */
export const PROMOTE_COMMAND: CliCommand = {
  name: "promote",
  summary: "Ship the commit one environment runs to the next, through runway's providers",
  usage:
    "stackra promote --to <dev|preview|staging|production> [--from <environment>] [--sha <sha>] [--dry-run] [--approved]",
  options: {
    to: { type: "string" },
    from: { type: "string" },
    sha: { type: "string" },
    "dry-run": { type: "boolean" },
    approved: { type: "boolean" },
  },
  run: runRunwayPromote,
};
