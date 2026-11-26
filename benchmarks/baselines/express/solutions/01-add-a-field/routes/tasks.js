const { randomUUID } = require("node:crypto");
const express = require("express");

const { ApiError } = require("../api-error");

const router = express.Router();
const tasks = new Map();

const validTitle = (title) =>
  typeof title === "string" && title.trim().length >= 1 && title.trim().length <= 120;

function isCalendarDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

function invalidDueDate() {
  return new ApiError(
    400,
    "invalid_due_date",
    "dueDate is a real date written YYYY-MM-DD, or null",
  );
}

function dueDateOf(value) {
  if (value === null || value === undefined) return null;
  if (!isCalendarDate(value)) throw invalidDueDate();
  return value;
}

function bodyOf(req) {
  const body = req.body ?? {};
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    throw new ApiError(400, "invalid_json", "the body is not a JSON object");
  }
  return body;
}

function find(id) {
  const task = tasks.get(id);
  if (!task) throw new ApiError(404, "not_found", "task not found");
  return task;
}

router.get("/", (req, res) => {
  const all = [...tasks.values()];
  const { dueBefore } = req.query;
  if (dueBefore === undefined) return res.json({ items: all });
  if (!isCalendarDate(dueBefore)) throw invalidDueDate();
  res.json({ items: all.filter((task) => task.dueDate !== null && task.dueDate < dueBefore) });
});

router.get("/:id", (req, res) => {
  res.json(find(req.params.id));
});

router.post("/", (req, res) => {
  const body = bodyOf(req);
  if (!validTitle(body.title)) {
    throw new ApiError(400, "invalid_title", "title is 1 to 120 characters");
  }
  const dueDate = dueDateOf(body.dueDate);
  const task = { id: randomUUID(), title: body.title.trim(), done: body.done === true, dueDate };
  tasks.set(task.id, task);
  res.status(201).json(task);
});

router.patch("/:id", (req, res) => {
  const body = bodyOf(req);
  const task = find(req.params.id);
  if ("title" in body && !validTitle(body.title)) {
    throw new ApiError(400, "invalid_title", "title is 1 to 120 characters");
  }
  const dueDate = "dueDate" in body ? dueDateOf(body.dueDate) : task.dueDate;
  if (typeof body.title === "string") task.title = body.title.trim();
  if (typeof body.done === "boolean") task.done = body.done;
  task.dueDate = dueDate;
  res.json(task);
});

module.exports = router;
