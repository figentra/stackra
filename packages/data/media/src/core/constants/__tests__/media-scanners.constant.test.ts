/**
 * Stackra file contract:
 * Purpose: unit tests of `MEDIA_SCANNERS`: one name per shipped `FileScanner` driver, each its class name less the
 *          port and kind, in snake_case.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 4).
 */
import { describe, expect, it } from "@stackra/testing";

import { MEDIA_SCANNERS } from "#core/constants/media-scanners.constant";
import { MemoryFileScannerDriver } from "#core/drivers/memory-file-scanner.driver";
import { ClamavFileScannerDriver } from "#node/drivers/clamav-file-scanner.driver";
import { GuardDutyFileScannerDriver } from "#node/drivers/guard-duty-file-scanner.driver";

/** `GuardDutyFileScannerDriver` to `guard_duty`. */
function driverName(type: { readonly name: string }): string {
  return type.name
    .replace(/FileScannerDriver$/, "")
    .replaceAll(/([a-z0-9])([A-Z])/g, "$1_$2")
    .toLowerCase();
}

describe("MEDIA_SCANNERS", () => {
  it("names every shipped scanner once", () => {
    expect([...MEDIA_SCANNERS]).toEqual(
      [MemoryFileScannerDriver, ClamavFileScannerDriver, GuardDutyFileScannerDriver].map(
        driverName,
      ),
    );
  });
});
