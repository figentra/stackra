/**
 * Stackra file contract:
 * Purpose: acceptance tests for task 1 (add a due date to a to-do item), run over HTTP so one set fits every framework.
 * Boundary: calls the app at BASE_URL with fetch; reads no file and starts no server.
 * Runtime: node (`node --test`)
 * Governing contract: benchmarks/tasks/01-add-a-field/prompt.md and benchmarks/tasks/starting-app.md.
 * Input: the BASE_URL environment variable, the address of the running app under test.
 * Output: pass or fail per test; the runner counts them.
 * Secrets: none.
 */
import assert from "node:assert/strict";
import { test } from "node:test";

const BASE_URL = process.env.BASE_URL;

async function call(method, path, body) {
  const init = { method, headers: { "content-type": "application/json" } };
  if (body !== undefined) init.body = JSON.stringify(body);
  const response = await fetch(`${BASE_URL}${path}`, init);
  const text = await response.text();
  return { status: response.status, body: text === "" ? null : JSON.parse(text) };
}

const create = (body) => call("POST", "/tasks", body);

test("a task created without a date has dueDate null", async () => {
  const { status, body } = await create({ title: "no date" });
  assert.equal(status, 201);
  assert.equal(body.dueDate, null);
});

test("a task created with a date returns it, and a read returns it too", async () => {
  const created = await create({ title: "with date", dueDate: "2026-12-01" });
  assert.equal(created.status, 201);
  assert.equal(created.body.dueDate, "2026-12-01");
  const read = await call("GET", `/tasks/${created.body.id}`);
  assert.equal(read.status, 200);
  assert.equal(read.body.dueDate, "2026-12-01");
});

test("PATCH sets and then clears the date", async () => {
  const { body: task } = await create({ title: "patch me" });
  const set = await call("PATCH", `/tasks/${task.id}`, { dueDate: "2027-01-15" });
  assert.equal(set.status, 200);
  assert.equal(set.body.dueDate, "2027-01-15");
  const cleared = await call("PATCH", `/tasks/${task.id}`, { dueDate: null });
  assert.equal(cleared.status, 200);
  assert.equal(cleared.body.dueDate, null);
});

test("a value that is not a calendar date is refused with invalid_due_date", async () => {
  for (const dueDate of ["2026-13-40", "2026-02-30", "soon", 20_261_201]) {
    const created = await create({ title: "bad date", dueDate });
    assert.equal(created.status, 400, `create with ${JSON.stringify(dueDate)}`);
    assert.equal(created.body.error.code, "invalid_due_date");
  }
  const { body: task } = await create({ title: "patch bad date" });
  const patched = await call("PATCH", `/tasks/${task.id}`, { dueDate: "not-a-date" });
  assert.equal(patched.status, 400);
  assert.equal(patched.body.error.code, "invalid_due_date");
});

test("GET /tasks lists dueDate on every item", async () => {
  await create({ title: "listed", dueDate: "2026-12-24" });
  const { status, body } = await call("GET", "/tasks");
  assert.equal(status, 200);
  assert.ok(body.items.length > 0);
  for (const item of body.items) assert.ok("dueDate" in item, `item ${item.id} has no dueDate`);
});

test("?dueBefore keeps only items dated strictly before it", async () => {
  const early = await create({ title: "early", dueDate: "2030-01-01" });
  const same = await create({ title: "same day", dueDate: "2030-06-01" });
  const late = await create({ title: "late", dueDate: "2030-12-31" });
  const undated = await create({ title: "undated 2030" });
  const { status, body } = await call("GET", "/tasks?dueBefore=2030-06-01");
  assert.equal(status, 200);
  const ids = new Set(body.items.map((item) => item.id));
  assert.ok(ids.has(early.body.id));
  assert.ok(!ids.has(same.body.id));
  assert.ok(!ids.has(late.body.id));
  assert.ok(!ids.has(undated.body.id));
});

test("existing behaviour keeps working: title is still required and done defaults to false", async () => {
  const missing = await create({});
  assert.equal(missing.status, 400);
  const { status, body } = await create({ title: "plain" });
  assert.equal(status, 201);
  assert.equal(body.done, false);
});
