/**
 * Stackra file contract:
 * Purpose: the starting app (benchmarks/tasks/starting-app.md) written with Node's own http module and no
 *   dependency. It is the "reference" baseline: it proves the acceptance tests and the runner without any framework.
 * Boundary: an in-memory http server on the port in the PORT environment variable; no file, no network out.
 * Runtime: node
 * Governing contract: benchmarks/tasks/starting-app.md.
 * Input: PORT.
 * Output: the to-do JSON API.
 * Secrets: none.
 */
import { randomUUID } from "node:crypto";
import { createServer } from "node:http";

const tasks = new Map();

function send(response, status, body) {
  const text = body === undefined ? "" : JSON.stringify(body);
  response.writeHead(status, { "content-type": "application/json" });
  response.end(text);
}

const fail = (response, status, code, message) =>
  send(response, status, { error: { code, message } });

async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString("utf8");
  if (text === "") return {};
  const value = JSON.parse(text);
  if (value === null || typeof value !== "object" || Array.isArray(value))
    throw new Error("not an object");
  return value;
}

const validTitle = (title) =>
  typeof title === "string" && title.trim().length >= 1 && title.trim().length <= 120;

const archiveAfterMs = Number(process.env.ARCHIVE_AFTER_SECONDS ?? 3600) * 1000;
const doneAt = new Map();
const job = { lastRunAt: null, archivedTotal: 0 };

function archiveFinished() {
  const now = Date.now();
  for (const task of tasks.values()) {
    const since = doneAt.get(task.id);
    if (task.done && !task.archived && since !== undefined && now - since >= archiveAfterMs) {
      task.archived = true;
      job.archivedTotal += 1;
    }
  }
  job.lastRunAt = new Date().toISOString();
}

setInterval(archiveFinished, 250).unref();

function setDone(task, done) {
  task.done = done;
  if (done) doneAt.set(task.id, Date.now());
  else {
    doneAt.delete(task.id);
    task.archived = false;
  }
}

async function handle(request, response) {
  const url = new URL(request.url, "http://localhost");
  const parts = url.pathname.split("/").filter(Boolean);
  if (request.method === "GET" && url.pathname === "/jobs/archive") {
    return send(response, 200, job);
  }
  if (parts[0] !== "tasks" || parts.length > 2)
    return fail(response, 404, "not_found", "not found");
  const id = parts[1];

  if (request.method === "GET" && id === undefined) {
    const wantArchived = url.searchParams.get("archived") === "true";
    const items = [...tasks.values()].filter((task) => task.archived === wantArchived);
    return send(response, 200, { items });
  }
  if (request.method === "GET") {
    const task = tasks.get(id);
    return task ? send(response, 200, task) : fail(response, 404, "not_found", "task not found");
  }

  let body;
  try {
    body = await readJson(request);
  } catch {
    return fail(response, 400, "invalid_json", "the body is not a JSON object");
  }

  if (request.method === "POST" && id === undefined) {
    if (!validTitle(body.title))
      return fail(response, 400, "invalid_title", "title is 1 to 120 characters");
    const task = { id: randomUUID(), title: body.title.trim(), done: false, archived: false };
    tasks.set(task.id, task);
    if (body.done === true) setDone(task, true);
    return send(response, 201, task);
  }
  if (request.method === "PATCH" && id !== undefined) {
    const task = tasks.get(id);
    if (!task) return fail(response, 404, "not_found", "task not found");
    if ("title" in body && !validTitle(body.title)) {
      return fail(response, 400, "invalid_title", "title is 1 to 120 characters");
    }
    if ("title" in body) task.title = body.title.trim();
    if (typeof body.done === "boolean" && body.done !== task.done) setDone(task, body.done);
    return send(response, 200, task);
  }
  return fail(response, 404, "not_found", "not found");
}

createServer((request, response) => {
  handle(request, response).catch(() => fail(response, 500, "internal_error", "internal error"));
}).listen(Number(process.env.PORT));
