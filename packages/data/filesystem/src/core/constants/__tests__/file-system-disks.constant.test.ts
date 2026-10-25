/**
 * Stackra file contract:
 * Purpose: unit tests of `FILE_SYSTEM_DISKS`: one name per shipped driver, each the prefix of its driver file in
 *          snake_case.
 * Boundary: test only; the driver class names stand in for the file names gen reads. `electron` does not load in
 *           vitest, so it is replaced by a stand-in.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 4).
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { FILE_SYSTEM_DISKS } from "#core/constants/file-system-disks.constant";
import { MemoryFileSystemDriver } from "#core/drivers/memory-file-system.driver";
import { ElectronFileSystemDriver } from "#desktop/drivers/electron-file-system.driver";
import { GcsFileSystemDriver } from "#node/drivers/gcs-file-system.driver";
import { EncoreBucketFileSystemDriver } from "#node/drivers/encore-bucket-file-system.driver";
import { LocalFileSystemDriver } from "#node/drivers/local-file-system.driver";
import { S3FileSystemDriver } from "#node/drivers/s3-file-system.driver";

vi.mock("electron", () => ({ app: { getPath: () => "/tmp/stackra-user-data" } }));

/** `MemoryFileSystemDriver` to `memory`: the class name less the port and kind, in snake_case. */
function driverName(type: { readonly name: string }): string {
  return type.name
    .replace(/FileSystemDriver$/, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .toLowerCase();
}

describe("FILE_SYSTEM_DISKS", () => {
  it("names every shipped driver once", () => {
    const drivers = [
      MemoryFileSystemDriver,
      LocalFileSystemDriver,
      S3FileSystemDriver,
      GcsFileSystemDriver,
      EncoreBucketFileSystemDriver,
      ElectronFileSystemDriver,
    ];
    expect([...FILE_SYSTEM_DISKS]).toEqual(drivers.map(driverName));
  });
});
