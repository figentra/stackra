/**
 * Stackra file contract:
 * Purpose: conformance tests of `refusalCode`, the derivation gen shares: the template's refusal classes give the codes
 *          their docblocks and committed manifests record, the core refusals give their own codes, digits and
 *          single-word stems are handled, and a name that is not PascalCase ending in `Error` (a bundler-renamed or
 *          minified class) is refused rather than guessed.
 * Boundary: test only. The expected codes are copied from the template's committed `stackra.manifest.json` files and
 *           refusal docblocks; gen imports this same function, so this table is the conformance check for both.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 20);
 *                     ADR 0231 (acronyms cased as words).
 */
import { describe, expect, it } from "@stackra/testing";

import { refusalCode } from "#core/functions/refusal-code.function";

/** Class name to the code gen locks in the manifest. */
const CONFORMANCE: ReadonlyArray<readonly [string, string]> = [
  ["OrderNotPayableError", "order_not_payable"],
  ["OrdersPausedError", "orders_paused"],
  ["InsufficientPointsError", "insufficient_points"],
  ["InsufficientStockError", "insufficient_stock"],
  ["NotAMemberError", "not_a_member"],
  ["NotOwnPrincipalError", "not_own_principal"],
  ["AccountFrozenError", "account_frozen"],
  ["AccessLogWriteFailedError", "access_log_write_failed"],
  ["SiteContextMissingError", "site_context_missing"],
  ["SessionRequiredError", "session_required"],
  ["ProductNotFoundError", "product_not_found"],
  ["VariantUnavailableError", "variant_unavailable"],
  ["InboxMessageNotFoundError", "inbox_message_not_found"],
  ["WorkflowTimedOutError", "workflow_timed_out"],
  ["ForbiddenError", "forbidden"],
  ["RateLimitedError", "rate_limited"],
  ["NotFoundError", "not_found"],
  ["IdempotencyKeyReusedError", "idempotency_key_reused"],
  ["ApiKeyRevokedError", "api_key_revoked"],
  ["Http2UnavailableError", "http2_unavailable"],
  ["XError", "x"],
];

describe("refusalCode", () => {
  it.each(CONFORMANCE)("derives %s as %s", (className, code) => {
    expect(refusalCode(className)).toBe(code);
  });

  it.each([
    "Error",
    "OrderNotPayable",
    "orderNotPayableError",
    "ForbiddenError$1",
    "e",
    "",
    "Order_Error",
  ])("refuses %j", (className) => {
    expect(() => refusalCode(className)).toThrow(RangeError);
  });

  it("names the rule in its refusal", () => {
    expect(() => refusalCode("e")).toThrow(/PascalCase ending in "Error"/);
  });
});
