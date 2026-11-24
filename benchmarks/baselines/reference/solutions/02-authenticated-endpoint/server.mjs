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

const tokens = new Map(
  (process.env.API_TOKENS ?? "")
    .split(",")
    .filter(Boolean)
    .map((pair) => pair.split("=")),
);
const comments = new Map();

function callerOf(request) {
  const match = /^Bearer (.+)$/.exec(request.headers.authorization ?? "");
  return match ? tokens.get(match[1]) : undefined;
}

const validText = (text) =>
  typeof text === "string" && text.trim().length >= 1 && text.trim().length <= 500;

async function handleComments(request, response, taskId, commentId) {
  const { method } = request;
  if (method === "GET" && commentId === undefined) {
    if (!tasks.has(taskId)) return fail(response, 404, "task_not_found", "task not found");
    const items = [...comments.values()].filter((comment) => comment.taskId === taskId);
    return send(response, 200, { items });
  }
  if (!(method === "POST" && commentId === undefined) && !(method === "DELETE" && commentId)) {
    return fail(response, 404, "not_found", "not found");
  }
  const caller = callerOf(request);
  if (caller === undefined)
    return fail(response, 401, "unauthenticated", "a valid token is needed");
  if (method === "POST") {
    let body;
    try {
      body = await readJson(request);
    } catch {
      return fail(response, 400, "invalid_comment", "the body is not a JSON object");
    }
    if (!tasks.has(taskId)) return fail(response, 404, "task_not_found", "task not found");
    if (!validText(body.text))
      return fail(response, 400, "invalid_comment", "text is 1 to 500 characters");
    const comment = { id: randomUUID(), taskId, text: body.text.trim(), author: caller };
    comments.set(comment.id, comment);
    return send(response, 201, comment);
  }
  if (!tasks.has(taskId)) return fail(response, 404, "task_not_found", "task not found");
  const comment = comments.get(commentId);
  if (!comment || comment.taskId !== taskId) {
    return fail(response, 404, "comment_not_found", "comment not found");
  }
  if (comment.author !== caller) return fail(response, 403, "forbidden", "not your comment");
  comments.delete(commentId);
  return send(response, 204);
}

async function handle(request, response) {
  const url = new URL(request.url, "http://localhost");
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts[0] === "tasks" && parts[2] === "comments" && parts.length <= 4) {
    return handleComments(request, response, parts[1], parts[3]);
  }
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
