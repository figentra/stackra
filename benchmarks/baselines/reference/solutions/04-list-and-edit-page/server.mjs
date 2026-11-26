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

const escapeHtml = (text) =>
  String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

function html(response, status, body, headers = {}) {
  response.writeHead(status, { "content-type": "text/html; charset=utf-8", ...headers });
  response.end(`<!doctype html><html><body>${body}</body></html>`);
}

const errorBlock = (message) =>
  message === undefined ? "" : `<div data-testid="form-error">${escapeHtml(message)}</div>`;

function listPage(show, message) {
  const shown = [...tasks.values()].filter(
    (task) => show === "all" || (show === "done" ? task.done : !task.done),
  );
  const rows = shown
    .map(
      (task) =>
        `<div data-testid="task-row" data-task-id="${escapeHtml(task.id)}">` +
        `<span data-testid="task-title">${escapeHtml(task.title)}</span> ` +
        `<span data-testid="task-done">${task.done ? "done" : "open"}</span> ` +
        `<a data-testid="task-edit-link" href="/ui/tasks/${escapeHtml(task.id)}/edit">Edit</a></div>`,
    )
    .join("");
  const empty = shown.length === 0 ? '<p data-testid="empty-state">Nothing to show</p>' : "";
  return (
    "<h1>Tasks</h1>" +
    errorBlock(message) +
    '<form data-testid="create-form" method="post" action="/ui/tasks">' +
    '<input data-testid="create-title" name="title" type="text">' +
    '<button data-testid="create-submit" type="submit">Add</button></form>' +
    `<p>Showing <span data-testid="task-count">${shown.length}</span></p>` +
    `<div data-testid="task-list">${rows}</div>${empty}`
  );
}

function editPage(task, typed, done, message) {
  return (
    "<h1>Edit task</h1>" +
    errorBlock(message) +
    `<form data-testid="edit-form" method="post" action="/ui/tasks/${escapeHtml(task.id)}">` +
    `<input data-testid="edit-title" name="title" type="text" value="${escapeHtml(typed)}">` +
    `<input data-testid="edit-done" name="done" type="checkbox" value="on"${done ? " checked" : ""}>` +
    '<button data-testid="edit-submit" type="submit">Save</button></form>'
  );
}

async function readForm(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return new URLSearchParams(Buffer.concat(chunks).toString("utf8"));
}

async function handleUi(request, response, parts, url) {
  const [, , id, tail] = parts;
  if (parts[1] !== "tasks" || parts.length > 4)
    return fail(response, 404, "not_found", "not found");
  const { method } = request;
  if (method === "GET" && id === undefined) {
    const show = url.searchParams.get("show");
    return html(response, 200, listPage(show === "open" || show === "done" ? show : "all"));
  }
  if (method === "POST" && id === undefined) {
    const title = (await readForm(request)).get("title") ?? "";
    if (!validTitle(title))
      return html(response, 400, listPage("all", "Title is 1 to 120 characters"));
    const task = { id: randomUUID(), title: title.trim(), done: false };
    tasks.set(task.id, task);
    return redirect(response);
  }
  const task = tasks.get(id);
  if (!task) return fail(response, 404, "not_found", "task not found");
  if (method === "GET" && tail === "edit") {
    return html(response, 200, editPage(task, task.title, task.done));
  }
  if (method === "POST" && tail === undefined) {
    const form = await readForm(request);
    const title = form.get("title") ?? "";
    const done = form.get("done") === "on";
    if (!validTitle(title)) {
      return html(response, 400, editPage(task, title, done, "Title is 1 to 120 characters"));
    }
    task.title = title.trim();
    task.done = done;
    return redirect(response);
  }
  return fail(response, 404, "not_found", "not found");
}

function redirect(response) {
  response.writeHead(303, { location: "/ui/tasks" });
  response.end();
}

async function handle(request, response) {
  const url = new URL(request.url, "http://localhost");
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts[0] === "ui") return handleUi(request, response, parts, url);
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
