/**
 * Stackra file contract:
 * Purpose: `ApiKeyMode`, whether an API key calls in test or live: chosen when the key is issued and written into its
 *          text after the kind's prefix (`stackra_sk_test_…`), so the key shows it and cannot be switched.
 * Boundary: an `Enum.of` value plus the type of the same name. A key with no mode segment (minted before modes) is
 *           live. The gateway turns a test key into a sandbox call (`CallOptions.sandbox`); what test means for the
 *           work is the product's (Pay picks its test Connection).
 * Runtime: isomorphic
 * Governing contract: ADR 0278 (amendment of 2026-11-09: key mode and version pin); STA-2646.
 */
import { Enum } from "@stackra/contracts";

/** The modes of an API key. */
export const ApiKeyMode = Enum.of({
  /** Calls run as a sandbox call: no real money, no real messages. */
  Test: "test",
  /** Calls run for real. */
  Live: "live",
});

/** One of the codes above. */
export type ApiKeyMode = Enum.Value<typeof ApiKeyMode>;
