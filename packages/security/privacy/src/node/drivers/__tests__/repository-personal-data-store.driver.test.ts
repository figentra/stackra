/**
 * Stackra file contract:
 * Purpose: unit tests of `RepositoryPersonalDataStoreDriver`: it reads through `find` by the subject property and
 *          copies only the declared fields, deletes through `purge` by id (nothing for no ids), and anonymises each
 *          row through `update` with the fields set to null.
 * Boundary: test only; the repository's methods are spied on the `repositoryOf` token's prototype, so no database
 *           runs. The database integration belongs to the testing session's tiers.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0189; STA-1375.
 */
import { CrudService, repositoryOf } from "@stackra/database";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { PersonalDataStore } from "#contracts/ports/personal-data-store.port";
import { Customer } from "#core/__tests__/customer.fixture";
import { SUBJECT } from "#core/__tests__/subject.fixture";
import { RepositoryPersonalDataStoreDriver } from "#node/drivers/repository-personal-data-store.driver";

afterEach(() => vi.restoreAllMocks());

describe("RepositoryPersonalDataStoreDriver", () => {
  it("is a PersonalDataStore driver over the model's repository token", () => {
    expect(new RepositoryPersonalDataStoreDriver()).toBeInstanceOf(PersonalDataStore);
    expect(repositoryOf(Customer).prototype).toBeInstanceOf(CrudService);
  });

  it("finds by the subject property and copies only declared fields", async () => {
    const find = vi
      .spyOn(repositoryOf(Customer).prototype, "find")
      .mockResolvedValue([{ id: "cus_1", userId: SUBJECT, name: "Lina", tier: "gold" }] as never);

    await expect(
      new RepositoryPersonalDataStoreDriver().find(Customer, "userId", SUBJECT, ["name", "phone"]),
    ).resolves.toEqual([{ id: "cus_1", fields: { name: "Lina", phone: null } }]);
    expect(find.mock.calls).toEqual([[{ userId: SUBJECT }]]);
  });

  it("purges by id, and nothing for no ids", async () => {
    const purge = vi.spyOn(repositoryOf(Customer).prototype, "purge").mockResolvedValue(2);
    const store = new RepositoryPersonalDataStoreDriver();

    await expect(store.remove(Customer, [])).resolves.toBe(0);
    await expect(store.remove(Customer, ["cus_1", "cus_2"])).resolves.toBe(2);
    expect(purge.mock.calls).toEqual([[{ id: { $in: ["cus_1", "cus_2"] } }]]);
  });

  it("anonymises each row with the fields set to null", async () => {
    const update = vi
      .spyOn(repositoryOf(Customer).prototype, "update")
      .mockResolvedValue({} as never);

    await expect(
      new RepositoryPersonalDataStoreDriver().anonymise(Customer, ["cus_1", "cus_2"], ["phone"]),
    ).resolves.toBe(2);
    expect(update.mock.calls).toEqual([
      [{ id: "cus_1" }, { phone: null }],
      [{ id: "cus_2" }, { phone: null }],
    ]);
  });
});
