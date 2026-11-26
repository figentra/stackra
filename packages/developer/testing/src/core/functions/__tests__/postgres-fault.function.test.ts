/**
 * Stackra file contract:
 * Purpose: unit tests of `postgresFault`: the trigger SQL fails the writes after `skip` up to `skip + times` with the
 *          SQLSTATE, on the chosen writes of the schema-qualified table, through a `security definer` function with
 *          an empty search path and a sequence counter; removal drops all three and is safe to repeat; the defaults
 *          (first write, `08006`); every identifier, the SQLSTATE and the counts are checked.
 * Boundary: test only; the SQL text. The trigger itself runs in the queue's, the outbox's and the payments'
 *           `.fault.int.test.ts` files on a real Postgres.
 * Runtime: node (vitest)
 * Governing contract: ADR 0182 (decisions 3 and 4); ADR 0269 (decision 2); ADR 0022 (test placement).
 */
import { describe, expect, it } from "vitest";

import { postgresFault } from "#core/functions/postgres-fault.function";

describe(postgresFault, () => {
  it("builds a trigger that fails the chosen writes after the skipped ones", () => {
    const fault = postgresFault({
      name: "job_remove",
      table: "queue.jobs",
      on: ["delete", "update", "delete"],
      skip: 2,
      times: 3,
      sqlstate: "40001",
    });
    expect(fault.message).toBe("injected fault: job_remove");
    const [sequence, fn, trigger] = fault.install;
    expect(sequence).toBe('create sequence "queue"."stackra_fault_job_remove_seq"');
    expect(fn).toContain(
      `create function "queue"."stackra_fault_job_remove"() returns trigger language plpgsql security definer set search_path = '' as $fault$`,
    );
    expect(fn).toContain(`n bigint := nextval('"queue"."stackra_fault_job_remove_seq"');`);
    expect(fn).toContain("if n > 2 and n <= 5 then");
    expect(fn).toContain("raise exception 'injected fault: job_remove' using errcode = '40001';");
    expect(fn).toContain("if tg_op = 'DELETE' then return old; end if;");
    expect(trigger).toBe(
      'create trigger "stackra_fault_job_remove" before delete or update on "queue"."jobs" for each row execute function "queue"."stackra_fault_job_remove"()',
    );
    expect(fault.remove).toEqual([
      'drop trigger if exists "stackra_fault_job_remove" on "queue"."jobs"',
      'drop function if exists "queue"."stackra_fault_job_remove"()',
      'drop sequence if exists "queue"."stackra_fault_job_remove_seq"',
    ]);
  });

  it("fails the first write with connection_failure by default", () => {
    const [, fn, trigger] = postgresFault({
      name: "save",
      table: "payments.records",
      on: "insert",
    }).install;
    expect(fn).toContain("if n > 0 and n <= 1 then");
    expect(fn).toContain("using errcode = '08006'");
    expect(trigger).toContain("before insert on");
  });

  it("refuses an identifier that is not snake_case", () => {
    expect(() => postgresFault({ name: "Bad-Name", table: "a.b", on: "insert" })).toThrow(
      'name "Bad-Name" is not a snake_case identifier',
    );
    expect(() => postgresFault({ name: "x", table: "jobs", on: "insert" })).toThrow(
      'table "jobs" is not schema.table',
    );
    expect(() => postgresFault({ name: "x", table: "a.b.c", on: "insert" })).toThrow(
      "is not schema.table",
    );
    expect(() => postgresFault({ name: "x", table: 'a";drop.b', on: "insert" })).toThrow(
      "is not a snake_case identifier",
    );
    expect(() => postgresFault({ name: "x", table: "a.B", on: "insert" })).toThrow(
      'table "B" is not a snake_case identifier',
    );
  });

  it("refuses a SQLSTATE that is not five characters, and an empty write list", () => {
    expect(() =>
      postgresFault({ name: "x", table: "a.b", on: "insert", sqlstate: "0800" }),
    ).toThrow('sqlstate "0800"');
    expect(() => postgresFault({ name: "x", table: "a.b", on: [] })).toThrow("on names no write");
  });

  it("refuses counts that are not whole numbers in range", () => {
    expect(() => postgresFault({ name: "x", table: "a.b", on: "insert", skip: -1 })).toThrow(
      "skip is a whole number from 0, got -1",
    );
    expect(() => postgresFault({ name: "x", table: "a.b", on: "insert", times: 0 })).toThrow(
      "times is a whole number from 1, got 0",
    );
    expect(() => postgresFault({ name: "x", table: "a.b", on: "insert", times: 1.5 })).toThrow(
      RangeError,
    );
  });
});
