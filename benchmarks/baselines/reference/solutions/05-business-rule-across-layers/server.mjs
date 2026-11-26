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

const STATUSES = ["open", "in_progress", "done"];
const MAX_IN_PROGRESS = 3;

const countInProgress = () => [...tasks.values()].filter((t) => t.status === "in_progress").length;

// Returns { status } (undefined when the request sets none) or { refusal: [code, message] }.
function statusFrom(body) {
  const hasDone = typeof body.done === "boolean";
  if ("status" in body) {
    if (!STATUSES.includes(body.status)) return { refusal: ["invalid_status", "unknown status"] };
    if (hasDone && (body.status === "done") !== body.done) {
      return { refusal: ["conflicting_state", "status and done disagree"] };
    }
    return { status: body.status };
  }
  return { status: hasDone ? (body.done ? "done" : "open") : undefined };
}

async function handle(request, response) {
  const url = new URL(request.url, "http://localhost");
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts[0] !== "tasks" || parts.length > 2)
    return fail(response, 404, "not_found", "not found");
  const id = parts[1];

  if (request.method === "GET" && id === "summary") {
    const all = [...tasks.values()];
    const counts = Object.fromEntries(
      STATUSES.map((s) => [s, all.filter((t) => t.status === s).length]),
    );
    return send(response, 200, { ...counts, total: all.length });
  }
  if (request.method === "GET" && id === undefined) {
    const wanted = url.searchParams.get("status");
    if (wanted !== null && !STATUSES.includes(wanted)) {
      return fail(response, 400, "invalid_status", "unknown status");
    }
    const items = [...tasks.values()].filter((t) => wanted === null || t.status === wanted);
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
    const asked = statusFrom(body);
    if (asked.refusal) return fail(response, 400, ...asked.refusal);
    const status = asked.status ?? "open";
    if (status === "in_progress" && countInProgress() >= MAX_IN_PROGRESS) {
      return fail(response, 409, "too_many_in_progress", "three tasks are already in progress");
    }
    const task = { id: randomUUID(), title: body.title.trim(), done: status === "done", status };
    tasks.set(task.id, task);
    return send(response, 201, task);
  }
  if (request.method === "PATCH" && id !== undefined) {
    const task = tasks.get(id);
    if (!task) return fail(response, 404, "not_found", "task not found");
    if ("title" in body && !validTitle(body.title)) {
      return fail(response, 400, "invalid_title", "title is 1 to 120 characters");
    }
    const asked = statusFrom(body);
    if (asked.refusal) return fail(response, 400, ...asked.refusal);
    const next = asked.status;
    if (next !== undefined && next !== task.status) {
      if (task.status === "done" && next === "in_progress") {
        return fail(response, 409, "invalid_transition", "a done task cannot go back in progress");
      }
      if (next === "in_progress" && countInProgress() >= MAX_IN_PROGRESS) {
        return fail(response, 409, "too_many_in_progress", "three tasks are already in progress");
      }
    }
    if ("title" in body) task.title = body.title.trim();
    if (next !== undefined) {
      task.status = next;
      task.done = next === "done";
    }
    return send(response, 200, task);
  }
  return fail(response, 404, "not_found", "not found");
}

createServer((request, response) => {
  handle(request, response).catch(() => fail(response, 500, "internal_error", "internal error"));
}).listen(Number(process.env.PORT));
