/**
 * Stackra file contract:
 * Purpose: acceptance tests for task 5 (a status workflow replacing the done flag, with a limit on tasks in progress),
 *   run over HTTP so one set fits every framework.
 * Boundary: calls the app at BASE_URL with fetch; reads no file and starts no server. The tests run in file order on
 *   a fresh app, because the limit counts tasks across the whole app; each test that fills the limit moves its tasks
 *   out of in_progress when it ends.
 * Runtime: node (`node --test`)
 * Governing contract: benchmarks/tasks/05-business-rule-across-layers/prompt.md and benchmarks/tasks/starting-app.md.
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

const create = (fields = {}) => call("POST", "/tasks", { title: "workflow", ...fields });
const patch = (id, fields) => call("PATCH", `/tasks/${id}`, fields);
const read = async (id) => (await call("GET", `/tasks/${id}`)).body;
const release = async (...ids) => {
  for (const id of ids) await patch(id, { status: "open" });
};

function assertRefused(response, status, code) {
  assert.equal(response.status, status, JSON.stringify(response.body));
  assert.equal(response.body.error.code, code);
}

test("a new task is open and not done", async () => {
  const { status, body } = await create();
  assert.equal(status, 201);
  assert.equal(body.status, "open");
  assert.equal(body.done, false);
});

test("POST accepts status, and the old done flag", async () => {
  const done = await create({ status: "done" });
  assert.equal(done.status, 201);
  assert.equal(done.body.status, "done");
  assert.equal(done.body.done, true);
  const oldWay = await create({ done: true });
  assert.equal(oldWay.body.status, "done");
  const inProgress = await create({ status: "in_progress" });
  assert.equal(inProgress.body.status, "in_progress");
  assert.equal(inProgress.body.done, false);
  await release(inProgress.body.id);
});

test("PATCH done true and false still work and map to done and open", async () => {
  const { body: task } = await create();
  const finished = await patch(task.id, { done: true });
  assert.equal(finished.status, 200);
  assert.equal(finished.body.status, "done");
  const reopened = await patch(task.id, { done: false });
  assert.equal(reopened.body.status, "open");
  assert.equal(reopened.body.done, false);
});

test("an unknown status is invalid_status on POST, PATCH and the list", async () => {
  assertRefused(await create({ status: "blocked" }), 400, "invalid_status");
  assertRefused(await create({ status: 3 }), 400, "invalid_status");
  const { body: task } = await create();
  assertRefused(await patch(task.id, { status: "archived" }), 400, "invalid_status");
  assertRefused(await call("GET", "/tasks?status=blocked"), 400, "invalid_status");
});

test("status and done that disagree are conflicting_state, and nothing changes", async () => {
  assertRefused(await create({ status: "open", done: true }), 400, "conflicting_state");
  assertRefused(await create({ status: "done", done: false }), 400, "conflicting_state");
  const { body: task } = await create({ title: "keep me" });
  const refused = await patch(task.id, { title: "changed", status: "in_progress", done: true });
  assertRefused(refused, 400, "conflicting_state");
  const after = await read(task.id);
  assert.equal(after.title, "keep me");
  assert.equal(after.status, "open");
  assert.equal((await create({ status: "done", done: true })).status, 201);
});

test("done to in_progress is invalid_transition and the task stays done", async () => {
  const { body: task } = await create({ status: "done" });
  assertRefused(await patch(task.id, { status: "in_progress" }), 409, "invalid_transition");
  assert.equal((await read(task.id)).status, "done");
});

test("every other move is allowed, and the same status again is a no-op", async () => {
  const { body: task } = await create();
  for (const status of [
    "in_progress",
    "done",
    "open",
    "done",
    "open",
    "in_progress",
    "in_progress",
  ]) {
    const moved = await patch(task.id, { status });
    assert.equal(moved.status, 200, `to ${status}`);
    assert.equal(moved.body.status, status);
    assert.equal(moved.body.done, status === "done");
  }
  await release(task.id);
});

test("a fourth in_progress task is refused with too_many_in_progress on PATCH", async () => {
  const tasks = [];
  for (let index = 0; index < 4; index += 1) tasks.push((await create()).body);
  for (const task of tasks.slice(0, 3)) {
    assert.equal((await patch(task.id, { status: "in_progress" })).status, 200);
  }
  assertRefused(await patch(tasks[3].id, { status: "in_progress" }), 409, "too_many_in_progress");
  assert.equal((await read(tasks[3].id)).status, "open");
  await release(...tasks.slice(0, 3).map((task) => task.id));
});

test("the limit also applies to POST, and a task already in progress can still be patched", async () => {
  const inProgress = [];
  for (let index = 0; index < 3; index += 1) {
    const { status, body } = await create({ status: "in_progress" });
    assert.equal(status, 201);
    inProgress.push(body.id);
  }
  assertRefused(await create({ status: "in_progress" }), 409, "too_many_in_progress");
  const renamed = await patch(inProgress[0], { title: "renamed while full" });
  assert.equal(renamed.status, 200);
  assert.equal(renamed.body.title, "renamed while full");
  assert.equal((await patch(inProgress[0], { status: "in_progress" })).status, 200);
  await release(...inProgress);
});

test("finishing a task frees a place under the limit", async () => {
  const ids = [];
  for (let index = 0; index < 3; index += 1)
    ids.push((await create({ status: "in_progress" })).body.id);
  assert.equal((await patch(ids[0], { status: "done" })).status, 200);
  const next = await create({ status: "in_progress" });
  assert.equal(next.status, 201);
  await release(ids[1], ids[2], next.body.id);
});

test("a refused request leaves valid fields in the same request unchanged", async () => {
  const { body: task } = await create({ title: "before" });
  const full = [];
  for (let index = 0; index < 3; index += 1)
    full.push((await create({ status: "in_progress" })).body.id);
  assertRefused(
    await patch(task.id, { title: "after", status: "in_progress" }),
    409,
    "too_many_in_progress",
  );
  assert.equal((await read(task.id)).title, "before");
  await release(...full);
});

test("GET /tasks?status filters and keeps creation order", async () => {
  const first = (await create({ title: "filter one", status: "in_progress" })).body;
  const other = (await create({ title: "filter two" })).body;
  const second = (await create({ title: "filter three", status: "in_progress" })).body;
  const { status, body } = await call("GET", "/tasks?status=in_progress");
  assert.equal(status, 200);
  assert.ok(body.items.every((item) => item.status === "in_progress"));
  const ids = body.items.map((item) => item.id);
  assert.ok(ids.includes(first.id) && ids.includes(second.id));
  assert.ok(!ids.includes(other.id));
  assert.ok(ids.indexOf(first.id) < ids.indexOf(second.id));
  await release(first.id, second.id);
});

test("GET /tasks/summary counts every status and the total", async () => {
  const before = (await call("GET", "/tasks/summary")).body;
  await create();
  await create({ status: "in_progress" });
  await create({ status: "done" });
  const { status, body } = await call("GET", "/tasks/summary");
  assert.equal(status, 200);
  assert.equal(body.open, before.open + 1);
  assert.equal(body.in_progress, before.in_progress + 1);
  assert.equal(body.done, before.done + 1);
  assert.equal(body.total, before.total + 3);
  assert.equal(body.total, body.open + body.in_progress + body.done);
  const listed = (await call("GET", "/tasks")).body.items.length;
  assert.equal(body.total, listed);
});

test("existing behaviour keeps working: title is required and the list still works", async () => {
  assert.equal((await call("POST", "/tasks", {})).status, 400);
  assert.equal((await call("GET", "/tasks")).status, 200);
  assert.equal((await call("GET", "/tasks/no-such-task")).status, 404);
});
