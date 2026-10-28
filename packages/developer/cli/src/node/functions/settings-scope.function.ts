/**
 * Stackra file contract:
 * Purpose: `settingsScope(values)`, the scope node a `stackra settings:*` or `search:reindex` command targets, from
 *          `--scope-id` (the node's public id) and `--scope-path` (its `ltree` path).
 * Boundary: pure over the parsed options; checks the spelling only. Whether the node exists, and whether it is a
 *           sandbox, is the database's and tenancy's to answer.
 * Runtime: node
 * Governing contract: ADR 0213 (decision 4); ADR 0327 (decision 3: a scope is an id and a path).
 */
import { CliUsageError } from "#node/errors/cli-usage.error";
import type { CliContext } from "#node/types/cli-context.type";

/** A scope node's public id. */
const SCOPE_ID = /^scp_[0-9a-z]{26}$/;

/** An `ltree` path: labels of letters, digits and underscores joined by dots. */
const SCOPE_PATH = /^[A-Za-z0-9_]+(?:\.[A-Za-z0-9_]+)*$/;

/**
 * The target node.
 *
 * @throws CliUsageError when either option is missing or misspelt.
 * @example
 * settingsScope({ "scope-id": "scp_01j9z3k4m5n6p7q8r9s0t1v2w2", "scope-path": "platform.acme_sandbox" });
 */
export function settingsScope(values: CliContext["values"]): {
  readonly id: string;
  readonly path: string;
} {
  const id = values["scope-id"];
  const path = values["scope-path"];
  if (typeof id !== "string" || !SCOPE_ID.test(id))
    throw new CliUsageError("name the node: --scope-id scp_<26 characters>");
  if (typeof path !== "string" || !SCOPE_PATH.test(path))
    throw new CliUsageError("name the node's path: --scope-path <label>.<label>");
  return { id, path };
}
