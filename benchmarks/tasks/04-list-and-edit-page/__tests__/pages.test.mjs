/**
 * Stackra file contract:
 * Purpose: acceptance tests for task 4 (a server-rendered list-and-edit page), run over HTTP: the tests fetch the HTML
 *   and read it by its data-testid markers, so one set fits every framework and no browser is needed.
 * Boundary: calls the app at BASE_URL with fetch; reads no file and starts no server.
 * Runtime: node (`node --test`)
 * Governing contract: benchmarks/tasks/04-list-and-edit-page/prompt.md and benchmarks/tasks/starting-app.md.
 * Input: the BASE_URL environment variable, the address of the running app under test.
 * Output: pass or fail per test; the runner counts them.
 * Secrets: none.
 */
import assert from "node:assert/strict";
import { test } from "node:test";

const BASE_URL = process.env.BASE_URL;

const ENTITIES = {
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&#x27;": "'",
  "&amp;": "&",
};

const decode = (text) =>
  text.replaceAll(/&(?:lt|gt|quot|amp|#39|#x27);/g, (match) => ENTITIES[match]);
const textOf = (html) => decode(html.replaceAll(/<[^>]*>/g, "")).trim();

const tagWithTestId = (html, testId) =>
  html.match(new RegExp(`<[^>]*data-testid="${testId}"[^>]*>`))?.[0];

const attribute = (tag, name) => {
  const quoted = tag?.match(new RegExp(`\\s${name}=(?:"([^"]*)"|'([^']*)')`));
  return quoted ? decode(quoted[1] ?? quoted[2]) : undefined;
};

function elementText(html, testId) {
  const tag = tagWithTestId(html, testId);
  if (tag === undefined) return undefined;
  const name = tag.match(/^<(\w+)/)[1];
  const start = html.indexOf(tag) + tag.length;
  const end = html.indexOf(`</${name}>`, start);
  return textOf(html.slice(start, end));
}

function rows(html) {
  const marker = /<[^>]*data-testid="task-row"[^>]*>/g;
  const starts = [...html.matchAll(marker)];
  return starts.map((match, index) => {
    const end = index + 1 < starts.length ? starts[index + 1].index : html.length;
    const segment = html.slice(match.index, end);
    return {
      id: attribute(match[0], "data-task-id"),
      title: elementText(segment, "task-title"),
      done: elementText(segment, "task-done"),
      editHref: attribute(tagWithTestId(segment, "task-edit-link"), "href"),
    };
  });
}

async function api(method, path, body) {
  const init = { method, headers: { "content-type": "application/json" } };
  if (body !== undefined) init.body = JSON.stringify(body);
  const response = await fetch(`${BASE_URL}${path}`, init);
  const text = await response.text();
  return { status: response.status, body: text === "" ? null : JSON.parse(text) };
}

const createTask = async (title, done = false) => {
  const { body } = await api("POST", "/tasks", { title });
  if (done) await api("PATCH", `/tasks/${body.id}`, { done: true });
  return body;
};

async function page(path) {
  const response = await fetch(`${BASE_URL}${path}`);
  return {
    status: response.status,
    type: response.headers.get("content-type"),
    html: await response.text(),
  };
}

async function submit(path, fields) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(fields).toString(),
    redirect: "manual",
  });
  return {
    status: response.status,
    location: response.headers.get("location"),
    html: await response.text(),
  };
}

const unique = (label) => `${label} ${Math.random().toString(36).slice(2, 8)}`;
const findRow = (html, id) => rows(html).find((row) => row.id === id);

// Runs first on purpose: the app is fresh, so no task is done yet and `?show=done` is empty.
test("an empty list shows empty-state, no rows and a count of 0", async () => {
  const { status, html } = await page("/ui/tasks?show=done");
  assert.equal(status, 200);
  assert.equal(rows(html).length, 0);
  assert.ok(tagWithTestId(html, "empty-state"), "no empty-state");
  assert.equal(elementText(html, "task-count"), "0");
});

test("the list page is HTML and shows a task with title, state and edit link", async () => {
  const task = await createTask(unique("listed"));
  const { status, type, html } = await page("/ui/tasks");
  assert.equal(status, 200);
  assert.match(type, /text\/html/);
  assert.ok(tagWithTestId(html, "task-list"), "no task-list");
  const row = findRow(html, task.id);
  assert.equal(row.title, task.title);
  assert.equal(row.done, "open");
  assert.equal(row.editHref, `/ui/tasks/${task.id}/edit`);
});

test("rows follow creation order and task-count matches the rows", async () => {
  const first = await createTask(unique("order a"));
  const second = await createTask(unique("order b"));
  const { html } = await page("/ui/tasks");
  const ids = rows(html).map((row) => row.id);
  assert.ok(ids.indexOf(first.id) < ids.indexOf(second.id));
  assert.equal(elementText(html, "task-count"), String(ids.length));
});

test("?show=open and ?show=done filter, and any other value shows all", async () => {
  const open = await createTask(unique("filter open"));
  const done = await createTask(unique("filter done"), true);
  const openPage = rows((await page("/ui/tasks?show=open")).html);
  assert.ok(openPage.some((row) => row.id === open.id));
  assert.ok(!openPage.some((row) => row.id === done.id));
  assert.ok(openPage.every((row) => row.done === "open"));
  const donePage = rows((await page("/ui/tasks?show=done")).html);
  assert.ok(donePage.some((row) => row.id === done.id));
  assert.ok(!donePage.some((row) => row.id === open.id));
  assert.ok(donePage.every((row) => row.done === "done"));
  for (const show of ["all", "nonsense"]) {
    const all = rows((await page(`/ui/tasks?show=${show}`)).html);
    assert.ok(all.some((row) => row.id === open.id) && all.some((row) => row.id === done.id), show);
  }
  const countPage = await page("/ui/tasks?show=done");
  assert.equal(elementText(countPage.html, "task-count"), String(donePage.length));
});

test("the create form posts to /ui/tasks with a title input", async () => {
  const { html } = await page("/ui/tasks");
  const form = tagWithTestId(html, "create-form");
  assert.equal(attribute(form, "method")?.toLowerCase(), "post");
  assert.equal(attribute(form, "action"), "/ui/tasks");
  assert.equal(attribute(tagWithTestId(html, "create-title"), "name"), "title");
  assert.ok(tagWithTestId(html, "create-submit"));
});

test("a valid create redirects with 303 and the task appears in the list and the API", async () => {
  const title = unique("made on the page");
  const { status, location } = await submit("/ui/tasks", { title: `  ${title}  ` });
  assert.equal(status, 303);
  assert.ok(location.endsWith("/ui/tasks"), location);
  const row = rows((await page("/ui/tasks")).html).find((item) => item.title === title);
  assert.ok(row, "the new task is not on the list");
  assert.equal((await api("GET", `/tasks/${row.id}`)).body.title, title);
});

test("an invalid create answers 400 with form-error and creates nothing", async () => {
  const before = rows((await page("/ui/tasks")).html).length;
  for (const title of ["", "   ", "x".repeat(121)]) {
    const { status, html } = await submit("/ui/tasks", { title });
    assert.equal(status, 400, `title length ${title.length}`);
    assert.ok((elementText(html, "form-error") ?? "") !== "", "no form-error message");
  }
  assert.equal(rows((await page("/ui/tasks")).html).length, before);
});

test("the edit page shows the current title and done state", async () => {
  const open = await createTask(unique("edit open"));
  const done = await createTask(unique("edit done"), true);
  const openPage = await page(`/ui/tasks/${open.id}/edit`);
  assert.equal(openPage.status, 200);
  assert.match(openPage.type, /text\/html/);
  const form = tagWithTestId(openPage.html, "edit-form");
  assert.equal(attribute(form, "method")?.toLowerCase(), "post");
  assert.equal(attribute(form, "action"), `/ui/tasks/${open.id}`);
  const titleInput = tagWithTestId(openPage.html, "edit-title");
  assert.equal(attribute(titleInput, "name"), "title");
  assert.equal(attribute(titleInput, "value"), open.title);
  assert.ok(!/\schecked(?:[\s=>]|$)/.test(tagWithTestId(openPage.html, "edit-done")));
  const doneBox = tagWithTestId((await page(`/ui/tasks/${done.id}/edit`)).html, "edit-done");
  assert.equal(attribute(doneBox, "name"), "done");
  assert.ok(/\schecked(?:[\s=>/]|$)/.test(doneBox), "checkbox is not checked");
  assert.ok(tagWithTestId(openPage.html, "edit-submit"));
});

test("saving changes the title and the done state, and an unsent checkbox means open", async () => {
  const task = await createTask(unique("to save"));
  const renamed = unique("renamed");
  const saved = await submit(`/ui/tasks/${task.id}`, { title: renamed, done: "on" });
  assert.equal(saved.status, 303);
  assert.ok(saved.location.endsWith("/ui/tasks"), saved.location);
  const afterSave = (await api("GET", `/tasks/${task.id}`)).body;
  assert.equal(afterSave.title, renamed);
  assert.equal(afterSave.done, true);
  assert.equal(findRow((await page("/ui/tasks")).html, task.id).done, "done");
  await submit(`/ui/tasks/${task.id}`, { title: renamed });
  assert.equal((await api("GET", `/tasks/${task.id}`)).body.done, false);
});

test("an invalid save answers 400 with form-error, keeps the typed text and saves nothing", async () => {
  const task = await createTask(unique("keep me"));
  const typed = "y".repeat(121);
  const { status, html } = await submit(`/ui/tasks/${task.id}`, { title: typed });
  assert.equal(status, 400);
  assert.ok((elementText(html, "form-error") ?? "") !== "", "no form-error message");
  assert.equal(attribute(tagWithTestId(html, "edit-title"), "value"), typed);
  assert.equal((await api("GET", `/tasks/${task.id}`)).body.title, task.title);
});

test("an unknown id is 404 on both the edit page and the save", async () => {
  assert.equal((await page("/ui/tasks/no-such-task/edit")).status, 404);
  assert.equal((await submit("/ui/tasks/no-such-task", { title: "x" })).status, 404);
});

test("titles are HTML-escaped in the list and in the edit field", async () => {
  const title = `<b>bold</b> & "quoted" ${Math.random().toString(36).slice(2, 6)}`;
  const task = await createTask(title);
  const list = await page("/ui/tasks");
  assert.ok(!list.html.includes("<b>bold</b>"), "the title is not escaped in the list");
  assert.equal(findRow(list.html, task.id).title, title);
  const edit = await page(`/ui/tasks/${task.id}/edit`);
  assert.ok(!edit.html.includes("<b>bold</b>"), "the title is not escaped in the edit page");
  assert.equal(attribute(tagWithTestId(edit.html, "edit-title"), "value"), title);
});

test("existing behaviour keeps working: the JSON API still lists tasks", async () => {
  const { status, body } = await api("GET", "/tasks");
  assert.equal(status, 200);
  assert.ok(Array.isArray(body.items));
});
