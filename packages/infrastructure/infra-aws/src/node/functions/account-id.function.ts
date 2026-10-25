/**
 * Stackra file contract:
 * Purpose: `accountId(value, label)`, a runway account (a quoted id or `ref:<path>`) resolved and checked to be a
 *          12-digit AWS account id.
 * Boundary: internal; the check catches a stack config value YAML or JSON read as a number, which drops leading
 *           zeros, before the id reaches a trust policy or a provider's allowed accounts.
 * Runtime: node
 * Governing contract: ADR 0172 (decision 1: accounts), ADR 0171 (`ref:` values).
 */
import { resolveRef } from "#node/functions/resolve-ref.function";

/**
 * The 12-digit id `value` stands for.
 *
 * @param label - what the account is, for the error (`providers.aws.accounts.backup`).
 * @throws TypeError when the resolved value is not 12 digits.
 */
export function accountId(value: string, label: string): string {
  const id = resolveRef(value);
  if (!/^\d{12}$/.test(id))
    throw new TypeError(
      `${label} (${value}) is not a 12-digit AWS account id; quote it in the stack config`,
    );
  return id;
}
