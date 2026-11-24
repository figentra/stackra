/**
 * Stackra file contract:
 * Purpose: acceptance tests for task 3 (a background job that archives finished items), run over HTTP so one set fits
 *   every framework.
 * Boundary: calls the app at BASE_URL with fetch and waits with timers; reads no file and starts no server. The
 *   runner starts the app with ARCHIVE_AFTER_SECONDS set to 2.
 * Runtime: node (`node --test`)
 * Governing contract: benchmarks/tasks/03-background-job/prompt.md and benchmarks/tasks/starting-app.md.
 * Input: the BASE_URL environment variable, the address of the running app under test.
 * Output: pass or fail per test; the runner counts them.
 * Secrets: none.
 */
import assert from "node:assert/strict";
import { setTimeout as sleep } from "node:timers/promises";
import { test } from "node:test";

const BASE_URL = process.env.BASE_URL;
const ARCHIVE_AFTER_MS = 2000;
const GIVE_UP_MS = 10_000;

async function call(method, path, body) {
  const init = { method, headers: { "content-type": "application/json" } };
  if (body !== undefined) init.body = JSON.stringify(body);
  const response = await fetch(`${BASE_URL}${path}`, init);
  const text = await response.text();
  return { status: response.status, body: text === "" ? null : JSON.parse(text) };
}

const create = async (title) => (await call("POST", "/tasks", { title })).body;
const read = async (id) => (await call("GET", `/tasks/${id}`)).body;
const markDone = (id, done) => call("PATCH", `/tasks/${id}`, { done });

async function waitFor(check) {
  const deadline = Date.now() + GIVE_UP_MS;
  while (Date.now() < deadline) {
    if (await check()) return true;
    await sleep(250);
  }
  return false;
}

test("a new task is not archived", async () => {
  const task = await create("fresh");
  assert.equal(task.archived, false);
});

test("a done task is archived by the job after the delay, not before", async () => {
  const task = await create("finish me");
  await markDone(task.id, true);
  assert.equal((await read(task.id)).archived, false, "archived straight away");
  const archived = await waitFor(async () => (await read(task.id)).archived === true);
  assert.ok(archived, "the job never archived the task");
});

test("a task that is not done is never archived", async () => {
  const task = await create("still open");
  await sleep(ARCHIVE_AFTER_MS + 1500);
  assert.equal((await read(task.id)).archived, false);
});

test("setting done back to false before the delay stops the archive", async () => {
  const task = await create("changed my mind");
  await markDone(task.id, true);
  await markDone(task.id, false);
  await sleep(ARCHIVE_AFTER_MS + 1500);
  const after = await read(task.id);
  assert.equal(after.done, false);
  assert.equal(after.archived, false);
});

test("the list leaves archived tasks out and ?archived=true returns only them", async () => {
  const kept = await create("stays listed");
  const gone = await create("goes to the archive");
  await markDone(gone.id, true);
  assert.ok(await waitFor(async () => (await read(gone.id)).archived === true));
  const listed = new Set((await call("GET", "/tasks")).body.items.map((item) => item.id));
  assert.ok(listed.has(kept.id));
  assert.ok(!listed.has(gone.id));
  const archivedList = (await call("GET", "/tasks?archived=true")).body.items;
  assert.ok(archivedList.every((item) => item.archived === true));
  assert.ok(archivedList.some((item) => item.id === gone.id));
  assert.ok(!archivedList.some((item) => item.id === kept.id));
});

test("an archived task is still readable by id", async () => {
  const task = await create("read me later");
  await markDone(task.id, true);
  assert.ok(await waitFor(async () => (await read(task.id)).archived === true));
  const { status, body } = await call("GET", `/tasks/${task.id}`);
  assert.equal(status, 200);
  assert.equal(body.archived, true);
});

test("PATCH done false brings an archived task back", async () => {
  const task = await create("come back");
  await markDone(task.id, true);
  assert.ok(await waitFor(async () => (await read(task.id)).archived === true));
  const { status, body } = await markDone(task.id, false);
  assert.equal(status, 200);
  assert.equal(body.archived, false);
  const listed = new Set((await call("GET", "/tasks")).body.items.map((item) => item.id));
  assert.ok(listed.has(task.id));
});

test("GET /jobs/archive reports the last run and the total archived", async () => {
  const before = (await call("GET", "/jobs/archive")).body;
  const task = await create("counted");
  await markDone(task.id, true);
  assert.ok(await waitFor(async () => (await read(task.id)).archived === true));
  const { status, body } = await call("GET", "/jobs/archive");
  assert.equal(status, 200);
  assert.equal(typeof body.lastRunAt, "string");
  assert.ok(!Number.isNaN(Date.parse(body.lastRunAt)));
  assert.ok(body.archivedTotal >= before.archivedTotal + 1);
});

test("existing behaviour keeps working: done and title still patch", async () => {
  const task = await create("patch");
  const { status, body } = await call("PATCH", `/tasks/${task.id}`, { title: "renamed" });
  assert.equal(status, 200);
  assert.equal(body.title, "renamed");
  assert.equal(body.done, false);
});
