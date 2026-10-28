/**
 * Stackra file contract:
 * Purpose: `parseApiKey`, what an API key's text says before any lookup: which kind its prefix names and whether its
 *          checksum matches; `undefined` for text with no configured prefix.
 * Boundary: pure; never a lookup and never a proof the key exists. The gateway rejects a malformed key here, without a
 *           database read (ADR 0278 decision 5). The longest matching prefix wins, so one prefix may extend another.
 * Runtime: isomorphic
 * Governing contract: ADR 0278 (decisions 4 and 5).
 */
import { crc32 } from "@stackra/support";

import type { IdentityConfig } from "#config/identity.config";
import type { ApiKeyKind } from "#core/enums/api-key-kind.enum";
import { base62Of } from "#core/functions/base62-of.function";
import { sameText } from "#core/functions/same-text.function";
import type { ParsedApiKey } from "#core/types/parsed-api-key.type";

/** A key's body and checksum: base-62 only. */
const TAIL = /^[0-9A-Za-z]{36}$/;

/**
 * What `key` says.
 *
 * @example
 * parseApiKey(header, identity); // { kind: "publishable", wellFormed: true }
 */
export function parseApiKey(
  key: string,
  config: Pick<IdentityConfig, "apiKeyPrefixes">,
): ParsedApiKey | undefined {
  const match = (Object.entries(config.apiKeyPrefixes) as [ApiKeyKind, string][])
    .filter(([, prefix]) => key.startsWith(`${prefix}_`))
    // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
    .sort(([, a], [, b]) => b.length - a.length)[0];
  if (match === undefined) return undefined;
  const [kind, prefix] = match;
  const tail = key.slice(prefix.length + 1);
  if (!TAIL.test(tail)) return { kind, wellFormed: false };
  const head = key.slice(0, -6);
  return { kind, wellFormed: sameText(base62Of(crc32(head), 6), key.slice(-6)) };
}
