/**
 * Stackra file contract:
 * Purpose: unit tests of `resolveRef`: a literal comes back as a string; `ref:<key>` reads the project key `<key>` and
 *          `ref:<key>.<path>` walks into that config object; an unset path or an object value fails naming the runway
 *          path and the `pulumi config set` that fixes it.
 * Boundary: test only; Pulumi under mocks with an in-memory stack config.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0171 (decision 4), ADR 0296 (`ref:` values).
 */
import { beforeEach, describe, expect, it } from "@stackra/testing";

import { thrownIssues } from "#core/__tests__/fixtures/thrown-issues.fixture";
import { mockPulumi } from "#node/functions/__tests__/fixtures/pulumi-mocks.fixture";
import { resolveRef } from "#node/functions/resolve-ref.function";

beforeEach(async () => {
  await mockPulumi({
    "infra:project": "figentra",
    "infra:cloudflare": JSON.stringify({
      accountId: "acc-1",
      zones: { acme: "zone-1" },
      port: 443,
    }),
  });
});

describe("resolveRef", () => {
  it("returns a literal as a string", () => {
    expect(resolveRef("figentra.com")).toBe("figentra.com");
    expect(resolveRef(42)).toBe("42");
    expect(resolveRef(true)).toBe("true");
  });

  it("reads a key and walks a path from the runway config namespace", () => {
    expect(resolveRef("ref:project")).toBe("figentra");
    expect(resolveRef("ref:cloudflare.accountId")).toBe("acc-1");
    expect(resolveRef("ref:cloudflare.zones.acme")).toBe("zone-1");
    expect(resolveRef("ref:cloudflare.port")).toBe("443");
  });

  it("refuses an unset path and a value that is not a scalar", () => {
    expect(
      thrownIssues(() =>
        resolveRef("ref:cloudflare.zones.missing", "providers.cloudflare.zones.missing"),
      ),
    ).toEqual([
      {
        path: "providers.cloudflare.zones.missing",
        message:
          "ref:cloudflare.zones.missing is not set: `pulumi config set --path cloudflare.zones.missing <value>`",
      },
    ]);
    expect(thrownIssues(() => resolveRef("ref:cloudflare.zones"))[0]?.path).toBe("value");
    expect(thrownIssues(() => resolveRef("ref:nothing"))).toHaveLength(1);
  });
});
