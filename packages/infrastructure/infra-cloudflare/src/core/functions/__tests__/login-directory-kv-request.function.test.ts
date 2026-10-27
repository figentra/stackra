/**
 * Stackra file contract:
 * Purpose: unit tests of `loginDirectoryKvRequest`: put is a bulk write of value `1`, remove a bulk delete of the keys;
 *          a malformed id, no keys or a key that is not a directory key is refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0451.
 */
import { describe, expect, it } from "@stackra/testing";

import { thrownIssues } from "#core/__tests__/fixtures/thrown-issues.fixture";
import { loginDirectoryKvRequest } from "#core/functions/login-directory-kv-request.function";

const ids = { accountId: "acc1", namespaceId: "ns1" };

describe("loginDirectoryKvRequest", () => {
  it("puts and removes in bulk", () => {
    expect(
      loginDirectoryKvRequest({ action: "put", ...ids, keys: ["dir:k1:email:aa:eu"] }),
    ).toEqual({
      method: "PUT",
      path: "/accounts/acc1/storage/kv/namespaces/ns1/bulk",
      body: [{ key: "dir:k1:email:aa:eu", value: "1" }],
    });
    expect(
      loginDirectoryKvRequest({ action: "remove", ...ids, keys: ["dir:k1:email:aa:eu"] }),
    ).toEqual({
      method: "POST",
      path: "/accounts/acc1/storage/kv/namespaces/ns1/bulk/delete",
      body: ["dir:k1:email:aa:eu"],
    });
  });

  it("refuses bad ids and keys", () => {
    expect(
      thrownIssues(() =>
        loginDirectoryKvRequest({
          action: "put",
          accountId: "a/b",
          namespaceId: "ns1",
          keys: ["ana@example.com"],
        }),
      ).map((issue) => issue.path),
    ).toEqual(["accountId", "keys.0"]);
    expect(
      thrownIssues(() => loginDirectoryKvRequest({ action: "remove", ...ids, keys: [] })).map(
        (issue) => issue.path,
      ),
    ).toEqual(["keys"]);
  });
});
