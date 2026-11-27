/**
 * Stackra file contract:
 * Purpose: `renameSyncSql(schema, table, from, to)`, the trigger that keeps an expand-phase column rename in step: while
 *          both columns exist, a row written through either name gets the same value in the other, so the release that
 *          still writes `from` and the one that writes `to` run side by side (`t.renameColumn`), until
 *          `t.finishRenameColumn` drops it with `from`.
 * Boundary: pure SQL text. A `BEFORE INSERT OR UPDATE` row trigger and its `plpgsql` function in the module's schema,
 *           both named `trg_<table>_<from>_<to>`; on insert a null side takes the other, on update the side that changed
 *           wins. The function pins its search path and names nothing but the row, and has no blank line, so a runner
 *           that splits a step on blank lines keeps it whole. Values copy by assignment cast: a rename is not a type
 *           change.
 * Runtime: node
 * Governing contract: ADR 0159 (decision 3: expand and contract); ADR 0231 (names).
 */
import { constraintName } from "#core/functions/constraint-name.function";
import { quoteIdentifier } from "#core/functions/quote-identifier.function";

/** The dollar quote of the function body, which the `DO` gates' `$$` never meets. */
const BODY_QUOTE = "$stackra$";

/**
 * The create and drop statements of the sync trigger between `from` and `to` on `table`.
 *
 * @param schema - the module's Postgres schema.
 * @param table - the table name, without its schema (it names the trigger).
 * @param from - the column's old name.
 * @param to - the column's new name.
 * @throws TypeError when the trigger's name would be longer than Postgres keeps.
 * @example
 * renameSyncSql("orders", "orders", "note", "memo").createTrigger;
 * // 'create trigger "trg_orders_note_memo" before insert or update on "orders"."orders" ...'
 */
export function renameSyncSql(
  schema: string,
  table: string,
  from: string,
  to: string,
): {
  readonly createFunction: string;
  readonly createTrigger: string;
  readonly dropTrigger: string;
  readonly dropFunction: string;
} {
  const name = constraintName("trg", table, [from, to]);
  const qualified = `${quoteIdentifier(schema)}.${quoteIdentifier(table)}`;
  const fn = `${quoteIdentifier(schema)}.${quoteIdentifier(name)}`;
  const trigger = quoteIdentifier(name);
  const [oldName, newName] = [quoteIdentifier(from), quoteIdentifier(to)];
  return {
    createFunction: [
      `create function ${fn}() returns trigger language plpgsql set search_path = pg_catalog, pg_temp as ${BODY_QUOTE}`,
      "begin",
      "  if tg_op = 'INSERT' then",
      `    if new.${newName} is null then new.${newName} := new.${oldName};`,
      `    elsif new.${oldName} is null then new.${oldName} := new.${newName};`,
      "    end if;",
      `  elsif new.${newName} is distinct from old.${newName} then new.${oldName} := new.${newName};`,
      `  elsif new.${oldName} is distinct from old.${oldName} then new.${newName} := new.${oldName};`,
      "  end if;",
      "  return new;",
      "end",
      BODY_QUOTE,
    ].join("\n"),
    createTrigger: `create trigger ${trigger} before insert or update on ${qualified} for each row execute function ${fn}()`,
    dropTrigger: `drop trigger if exists ${trigger} on ${qualified}`,
    dropFunction: `drop function if exists ${fn}()`,
  };
}
