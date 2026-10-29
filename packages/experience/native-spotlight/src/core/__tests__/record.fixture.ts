/**
 * Stackra file contract:
 * Purpose: `record`, a test fixture: a non-sensitive customer record of `USER`, changed an hour before `NOW`, with any
 *          field overridden.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269.
 */
import { USER } from "#core/__tests__/user.fixture";
import type { DeviceSearchRecord } from "#core/types/device-search-record.type";

/** A record of `USER` with `overrides` laid over it. */
export function record(overrides: Partial<DeviceSearchRecord> = {}): DeviceSearchRecord {
  return {
    kind: "crm.customer",
    ownerId: USER,
    isSensitive: false,
    updatedAt: "2026-10-29T11:00:00.000Z",
    url: "figentra://crm/customers/cus_1",
    title: "Sara Al-Harbi",
    description: "Riyadh",
    keywords: ["vip"],
    ...overrides,
  };
}
