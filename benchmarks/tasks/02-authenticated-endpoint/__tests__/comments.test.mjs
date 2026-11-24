/**
 * Stackra file contract:
 * Purpose: acceptance tests for task 2 (authenticated comments with validation), run over HTTP so one set fits every
 *   framework.
 * Boundary: calls the app at BASE_URL with fetch; reads no file and starts no server. The runner starts the app with
 *   API_TOKENS set to `token-alice=alice,token-bob=bob`; these are fixed test names, not real credentials.
 * Runtime: node (`node --test`)
 * Governing contract: benchmarks/tasks/02-authenticated-endpoint/prompt.md and benchmarks/tasks/starting-app.md.
 * Input: the BASE_URL environment variable, the address of the running app under test.
 * Output: pass or fail per test; the runner counts them.
 * Secrets: none.
 */
import assert from "node:assert/strict";
import { test } from "node:test";

const BASE_URL = process.env.BASE_URL;
const ALICE = "token-alice";
const BOB = "token-bob";

async function call(method, path, { token, body, rawBody } = {}) {
  const headers = { "content-type": "application/json" };
  if (token !== undefined) headers.authorization = `Bearer ${token}`;
  const init = { method, headers };
  if (rawBody !== undefined) init.body = rawBody;
  else if (body !== undefined) init.body = JSON.stringify(body);
  const response = await fetch(`${BASE_URL}${path}`, init);
  const text = await response.text();
  return { status: response.status, body: text === "" ? null : JSON.parse(text) };
}

async function newTask() {
  const { body } = await call("POST", "/tasks", { body: { title: "commented" } });
  return body.id;
}

const comment = (taskId, token, text) =>
  call("POST", `/tasks/${taskId}/comments`, { token, body: { text } });

test("an authenticated POST creates a comment authored by the caller", async () => {
  const taskId = await newTask();
  const { status, body } = await comment(taskId, ALICE, "first");
  assert.equal(status, 201);
  assert.equal(body.text, "first");
  assert.equal(body.author, "alice");
  assert.equal(body.taskId, taskId);
  assert.equal(typeof body.id, "string");
});

test("the text is trimmed before it is stored", async () => {
  const taskId = await newTask();
  const { status, body } = await comment(taskId, BOB, "  padded  ");
  assert.equal(status, 201);
  assert.equal(body.text, "padded");
});

test("a text of exactly 500 characters is accepted and 501 is refused", async () => {
  const taskId = await newTask();
  assert.equal((await comment(taskId, ALICE, "x".repeat(500))).status, 201);
  const tooLong = await comment(taskId, ALICE, "x".repeat(501));
  assert.equal(tooLong.status, 400);
  assert.equal(tooLong.body.error.code, "invalid_comment");
});

test("a missing, empty, blank or non-string text is invalid_comment", async () => {
  const taskId = await newTask();
  const empty = await call("POST", `/tasks/${taskId}/comments`, { token: ALICE, body: {} });
  assert.equal(empty.status, 400);
  assert.equal(empty.body.error.code, "invalid_comment");
  for (const text of ["", "   ", 42, null, ["a"]]) {
    const refused = await comment(taskId, ALICE, text);
    assert.equal(refused.status, 400, JSON.stringify(text));
    assert.equal(refused.body.error.code, "invalid_comment");
  }
});

test("no token, a malformed header and an unknown token are unauthenticated", async () => {
  const taskId = await newTask();
  const none = await comment(taskId, undefined, "hello");
  assert.equal(none.status, 401);
  assert.equal(none.body.error.code, "unauthenticated");
  const unknown = await comment(taskId, "token-mallory", "hello");
  assert.equal(unknown.status, 401);
  assert.equal(unknown.body.error.code, "unauthenticated");
  const malformed = await fetch(`${BASE_URL}/tasks/${taskId}/comments`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: ALICE },
    body: JSON.stringify({ text: "hello" }),
  });
  assert.equal(malformed.status, 401);
});

test("the token is checked before the body and the task", async () => {
  const badBody = await call("POST", "/tasks/no-such-task/comments", { body: {} });
  assert.equal(badBody.status, 401);
});

test("an unknown task is task_not_found", async () => {
  const { status, body } = await comment("no-such-task", ALICE, "hello");
  assert.equal(status, 404);
  assert.equal(body.error.code, "task_not_found");
});

test("GET lists comments in creation order without a token", async () => {
  const taskId = await newTask();
  await comment(taskId, ALICE, "one");
  await comment(taskId, BOB, "two");
  const { status, body } = await call("GET", `/tasks/${taskId}/comments`);
  assert.equal(status, 200);
  assert.deepEqual(
    body.items.map((item) => [item.text, item.author]),
    [
      ["one", "alice"],
      ["two", "bob"],
    ],
  );
});

test("comments belong to their own task", async () => {
  const first = await newTask();
  const second = await newTask();
  await comment(first, ALICE, "only on first");
  const { body } = await call("GET", `/tasks/${second}/comments`);
  assert.deepEqual(body.items, []);
});

test("only the author may delete; the comment stays after a refused delete", async () => {
  const taskId = await newTask();
  const { body: created } = await comment(taskId, ALICE, "mine");
  const path = `/tasks/${taskId}/comments/${created.id}`;
  const noToken = await call("DELETE", path);
  assert.equal(noToken.status, 401);
  assert.equal(noToken.body.error.code, "unauthenticated");
  const other = await call("DELETE", path, { token: BOB });
  assert.equal(other.status, 403);
  assert.equal(other.body.error.code, "forbidden");
  assert.equal((await call("GET", `/tasks/${taskId}/comments`)).body.items.length, 1);
  const own = await call("DELETE", path, { token: ALICE });
  assert.equal(own.status, 204);
  assert.equal((await call("GET", `/tasks/${taskId}/comments`)).body.items.length, 0);
});

test("deleting an unknown comment is comment_not_found", async () => {
  const taskId = await newTask();
  const { status, body } = await call("DELETE", `/tasks/${taskId}/comments/no-such-comment`, {
    token: ALICE,
  });
  assert.equal(status, 404);
  assert.equal(body.error.code, "comment_not_found");
});
