/**
 * Stackra file contract:
 * Purpose: unit tests of `loginDirectoryHandler`: a known identifier answers its regions in the configured order (a
 *          row for an undeclared region ignored), an unknown one answers none, the answer is `no-store` and never
 *          echoes the identifier, a non-POST is 405, and a body that is not a small JSON identifier or does not
 *          normalise is 400 without a KV read.
 * Boundary: test only; a map stands in for the KV binding and a fixed function for the identity prefix.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0451; ADR 0353 (decision 4).
 */
import { describe, expect, it } from "@stackra/testing";

import { loginDirectoryHandler } from "#core/functions/login-directory-handler.function";

const rows = [
  "dir:k1:email:aa:me-central",
  "dir:k1:email:aa:eu",
  "dir:k1:email:aa:old",
  "dir:k1:email:bb:eu",
];
/** The prefixes listed, newest last. */
const listed: string[] = [];
const kv = {
  list: ({ prefix }: { readonly prefix: string }) => {
    listed.push(prefix);
    return Promise.resolve({
      keys: rows.filter((name) => name.startsWith(prefix)).map((name) => ({ name })),
    });
  },
};
const handler = loginDirectoryHandler({
  kv,
  regions: ["eu", "me-central"],
  prefixOf: ({ kind, value }) =>
    Promise.resolve(
      kind === "email" && value.includes("@")
        ? `dir:k1:email:${value.startsWith("ana") ? "aa" : "cc"}:`
        : undefined,
    ),
});
const post = (body: string) =>
  handler(new Request("https://login.example/directory", { method: "POST", body }));

describe("loginDirectoryHandler", () => {
  it("answers the regions holding an account, in the configured order", async () => {
    const response = await post(JSON.stringify({ kind: "email", value: "ana@example.com" }));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const text = await response.text();
    expect(JSON.parse(text)).toEqual({ regions: ["eu", "me-central"] });
    expect(text).not.toContain("ana");
  });

  it("answers none for an unknown identifier", async () => {
    const response = await post(JSON.stringify({ kind: "email", value: "zed@example.com" }));
    expect(await response.json()).toEqual({ regions: [] });
  });

  it("refuses other methods and bad bodies without a KV read", async () => {
    listed.length = 0;
    expect((await handler(new Request("https://login.example/directory"))).status).toBe(405);
    expect((await post("not json")).status).toBe(400);
    expect((await post(JSON.stringify({ kind: "email" }))).status).toBe(400);
    expect((await post(JSON.stringify({ kind: "email", value: "x".repeat(2000) }))).status).toBe(
      400,
    );
    const invalid = await post(JSON.stringify({ kind: "email", value: "nobody" }));
    expect(invalid.status).toBe(400);
    expect(await invalid.json()).toEqual({ error: "invalid_identifier" });
    expect(listed).toEqual([]);
  });
});
