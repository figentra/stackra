const { randomUUID } = require("node:crypto");
const express = require("express");

const { ApiError } = require("../api-error");

const router = express.Router();
const tasks = new Map();

const validTitle = (title) =>
  typeof title === "string" && title.trim().length >= 1 && title.trim().length <= 120;

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
  res.json({ items: [...tasks.values()] });
});

router.get("/:id", (req, res) => {
  res.json(find(req.params.id));
});

router.post("/", (req, res) => {
  const body = bodyOf(req);
  if (!validTitle(body.title)) {
    throw new ApiError(400, "invalid_title", "title is 1 to 120 characters");
  }
  const task = { id: randomUUID(), title: body.title.trim(), done: body.done === true };
  tasks.set(task.id, task);
  res.status(201).json(task);
});

router.patch("/:id", (req, res) => {
  const body = bodyOf(req);
  const task = find(req.params.id);
  if ("title" in body && !validTitle(body.title)) {
    throw new ApiError(400, "invalid_title", "title is 1 to 120 characters");
  }
  if (typeof body.title === "string") task.title = body.title.trim();
  if (typeof body.done === "boolean") task.done = body.done;
  res.json(task);
});

module.exports = router;
