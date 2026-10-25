/**
 * Stackra file contract:
 * Purpose: unit tests of the tenancy enums added for sandboxes and shares: `TenantEnvironment`, `ShareStatus` and
 *          `RevokedCopy` hold their stored codes in order.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0280; ADR 0343; ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { RevokedCopy } from "#core/enums/revoked-copy.enum";
import { ShareStatus } from "#core/enums/share-status.enum";
import { TenantEnvironment } from "#core/enums/tenant-environment.enum";

describe("tenancy enums", () => {
  it("hold their stored codes", () => {
    expect(Enum.values(TenantEnvironment)).toEqual(["live", "sandbox"]);
    expect(Enum.values(ShareStatus)).toEqual(["proposed", "active", "declined", "revoked"]);
    expect(Enum.values(RevokedCopy)).toEqual(["keep", "delete"]);
  });
});
