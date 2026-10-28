/**
 * Stackra file contract:
 * Purpose: `redactSubjectMessages`, the outbox side of an erasure (gap gov6, stackra-275): every message still held in
 *          the outbox (due, waiting for a retry, or dead-lettered) whose payload names the erased subject gets the
 *          subject's personal fields set to null, so a late delivery or a dead-letter replay carries none of them.
 * Boundary: works through the `OutboxDriver` port only, so it runs in the caller's transaction. Which fields are
 *           personal is the caller's input (the erasure saga passes every field its `PersonalData` declarations name);
 *           a field of that name is nulled at any depth of a matching payload, a row change's `before` and `after`
 *           included. A message keeps its id, type and delivery state, so a consumer still receives it, without the
 *           values. A message that does not name the subject is left alone, and so is one with no such field.
 * Runtime: isomorphic
 * Governing contract: ADR 0189 (decision 2: erasure reaches every copy); ADR 0078 (decision 4: the outbox); ADR 0212
 *                     (crypto-shredding); data-layer gap gov6.
 */
import type { OutboxDriver } from "#contracts/index";

/** `data` with every field named in `fields` set to null at any depth, and whether anything changed. */
function nulled(data: unknown, fields: ReadonlySet<string>): { value: unknown; changed: boolean } {
  if (data === null || typeof data !== "object") return { value: data, changed: false };
  if (Array.isArray(data)) {
    const items = data.map((item: unknown) => nulled(item, fields));
    return { value: items.map((item) => item.value), changed: items.some((item) => item.changed) };
  }
  let changed = false;
  const copy: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(data)) {
    if (fields.has(key)) {
      changed ||= item !== null;
      copy[key] = null;
      continue;
    }
    const inner = nulled(item, fields);
    changed ||= inner.changed;
    copy[key] = inner.value;
  }
  return { value: copy, changed };
}

/**
 * Nulls `fields` in every held message that names `subject`.
 *
 * @param driver - the outbox store.
 * @param subject - the erased subject's public id, as the payloads carry it.
 * @param fields - the personal field names to null (`email`, `phone`).
 * @returns how many messages were rewritten.
 * @throws TypeError when `subject` is empty, which would match nothing useful.
 * @example
 * await redactSubjectMessages(outbox, "usr_1", new Set(["email", "phone"])); // 2
 */
export async function redactSubjectMessages(
  driver: OutboxDriver,
  subject: string,
  fields: ReadonlySet<string>,
): Promise<number> {
  if (subject === "")
    throw new TypeError("redactSubjectMessages: the subject's public id is required");
  if (fields.size === 0) return 0;
  let rewritten = 0;
  for (const message of await driver.holding(subject)) {
    const { value, changed } = nulled(message.data, fields);
    if (!changed) continue;
    await driver.rewrite(message.id, value);
    rewritten += 1;
  }
  return rewritten;
}
