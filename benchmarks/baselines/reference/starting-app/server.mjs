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

async function handle(request, response) {
  const url = new URL(request.url, "http://localhost");
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts[0] !== "tasks" || parts.length > 2)
    return fail(response, 404, "not_found", "not found");
  const id = parts[1];

  if (request.method === "GET" && id === undefined) {
    return send(response, 200, { items: [...tasks.values()] });
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
    const task = { id: randomUUID(), title: body.title.trim(), done: body.done === true };
    tasks.set(task.id, task);
    return send(response, 201, task);
  }
  if (request.method === "PATCH" && id !== undefined) {
    const task = tasks.get(id);
    if (!task) return fail(response, 404, "not_found", "task not found");
    if ("title" in body && !validTitle(body.title)) {
      return fail(response, 400, "invalid_title", "title is 1 to 120 characters");
    }
    if ("title" in body) task.title = body.title.trim();
    if (typeof body.done === "boolean") task.done = body.done;
    return send(response, 200, task);
  }
  return fail(response, 404, "not_found", "not found");
}

createServer((request, response) => {
  handle(request, response).catch(() => fail(response, 500, "internal_error", "internal error"));
}).listen(Number(process.env.PORT));
