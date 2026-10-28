/**
 * Stackra file contract:
 * Purpose: unit tests of `readNativeWrites`: native and query-builder writes with their model class, raw
 *          `insert into`/`update` statements with their table, comment lines, tests and database folders skipped.
 * Boundary: test only; writes small fixtures under `.cache/`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0465 (decision 5).
 */
import { describe, expect, it } from "@stackra/testing";

import { readNativeWrites } from "#node/functions/read-native-writes.function";
import { writeFixtureMember } from "#node/__tests__/fixtures/write-fixture-member";

describe("readNativeWrites", () => {
  it("finds writes that skip the unit of work", () => {
    const root = writeFixtureMember("crm", {
      "src/modules/crm/services/contact.service.ts": [
        "await em.nativeUpdate(Contact, { id }, { email });",
        "// await em.nativeInsert(Contact, row);",
        "await em.createQueryBuilder(Contact).update({ email }).where({ id });",
        'await em.execute(`update "crm"."contacts" set email = ?`, [email]);',
        "await em.persist(contact).flush();",
      ].join("\n"),
      "src/modules/crm/__tests__/contact.test.ts": "await em.nativeInsert(Contact, row);\n",
      "src/modules/crm/database/seeders/x.ts": "await em.insert(Contact, row);\n",
    });
    expect(
      readNativeWrites(root).map(({ line, method, target }) => ({ line, method, target })),
    ).toEqual([
      { line: 1, method: "nativeUpdate", target: "Contact" },
      { line: 3, method: "update", target: "Contact" },
      { line: 4, method: "sql", target: "crm.contacts" },
    ]);
  });
});
