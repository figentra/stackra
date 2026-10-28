/**
 * Stackra file contract:
 * Purpose: unit tests of `SubjectExportService`: `collect` searches every registered model (empty ones too) and keeps
 *          only declared fields; `archive` writes a zip under a random name in the export folder and returns a link
 *          that expires after `exportTtlDays`.
 * Boundary: test only; the memory store and a recording disk stand in for the database and the host disk.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0189 (decision 1); STA-1375.
 */
import { buildConfig } from "@stackra/config";
import type { Duration } from "@stackra/contracts";
import type { FileSystem } from "@stackra/filesystem/contracts";
import { afterEach, describe, expect, it } from "@stackra/testing";

import { PrivacyConfig } from "#config/privacy.config";
import { Address } from "#core/__tests__/address.fixture";
import { AddressPersonalData } from "#core/__tests__/address-personal-data.fixture";
import { Customer } from "#core/__tests__/customer.fixture";
import { CustomerPersonalData } from "#core/__tests__/customer-personal-data.fixture";
import { SUBJECT } from "#core/__tests__/subject.fixture";
import { MemoryPersonalDataStoreDriver } from "#core/drivers/memory-personal-data-store.driver";
import { registerPersonalData } from "#core/functions/register-personal-data.function";
import { SubjectExportService } from "#core/services/subject-export.service";
import { clearPersonalData } from "#testing/clear-personal-data.function";

/** When the export runs. */
const AT = new Date("2026-10-28T10:00:00Z");

/** A disk that keeps every written file's bytes and every signing call. */
function recordingDisk() {
  const written = new Map<string, Uint8Array>();
  const signed: [string, Duration][] = [];
  const disk = {
    async writeStream(path: string, contents: AsyncIterable<Uint8Array>) {
      const chunks: Uint8Array[] = [];
      for await (const chunk of contents) chunks.push(chunk);
      written.set(path, new Uint8Array(chunks.flatMap((chunk) => [...chunk])));
    },
    async temporaryUrl(path: string, expiresIn: Duration) {
      signed.push([path, expiresIn]);
      return `https://files.test/${path}?sig=1`;
    },
  };
  return { disk: disk as unknown as FileSystem, written, signed };
}

afterEach(() => clearPersonalData());

describe("SubjectExportService", () => {
  it("collects every registered model, empty ones too, with declared fields only", async () => {
    registerPersonalData("crm", [CustomerPersonalData, AddressPersonalData]);
    const store = new MemoryPersonalDataStoreDriver();
    store.put(Customer, [
      { id: "cus_1", userId: SUBJECT, name: "Lina", phone: null, tier: "gold" },
    ]);
    const service = new SubjectExportService(
      store,
      recordingDisk().disk,
      buildConfig(PrivacyConfig),
    );

    await expect(service.collect(SUBJECT, AT)).resolves.toEqual({
      subject: SUBJECT,
      generatedAt: "2026-10-28T10:00:00.000Z",
      sections: [
        { kind: "crm.customer", records: [{ id: "cus_1", fields: { name: "Lina", phone: null } }] },
        { kind: "crm.address", records: [] },
      ],
    });
    expect(Address).toBeDefined();
  });

  it("writes a zip under a random name and links it for exportTtlDays", async () => {
    const { disk, written, signed } = recordingDisk();
    const service = new SubjectExportService(
      new MemoryPersonalDataStoreDriver(),
      disk,
      buildConfig(PrivacyConfig, { values: { exportTtlDays: 3 } }),
    );

    const link = await service.archive({
      subject: SUBJECT,
      generatedAt: AT.toISOString(),
      sections: [{ kind: "crm.customer", records: [{ id: "cus_1", fields: { name: "Lina" } }] }],
    });

    expect(link.path).toMatch(/^privacy\/exports\/[0-9a-f-]{36}\.zip$/);
    expect(link.path).not.toContain(SUBJECT);
    expect(link.url).toBe(`https://files.test/${link.path}?sig=1`);
    expect(link.expiresAt).toBe("2026-10-31T10:00:00.000Z");
    expect(link.records).toBe(1);
    expect(signed).toEqual([[link.path, "P3D"]]);
    const zip = written.get(link.path);
    expect(zip?.slice(0, 4)).toEqual(new Uint8Array([0x50, 0x4b, 0x03, 0x04])); // a zip local header
  });
});
