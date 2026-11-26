import { randomUUID } from "node:crypto";

import { Injectable } from "@nestjs/common";

import { ApiError } from "../api-error.js";

export interface Task {
  id: string;
  title: string;
  done: boolean;
  dueDate: string | null;
}

type Body = Record<string, unknown>;

const validTitle = (title: unknown): title is string =>
  typeof title === "string" && title.trim().length >= 1 && title.trim().length <= 120;

function isCalendarDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

function invalidTitle(): ApiError {
  return new ApiError(400, "invalid_title", "title is 1 to 120 characters");
}

function invalidDueDate(): ApiError {
  return new ApiError(
    400,
    "invalid_due_date",
    "dueDate is a real date written YYYY-MM-DD, or null",
  );
}

function dueDateOf(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (!isCalendarDate(value)) throw invalidDueDate();
  return value;
}

@Injectable()
export class TasksService {
  private readonly tasks = new Map<string, Task>();

  list(dueBefore?: string): Task[] {
    const all = [...this.tasks.values()];
    if (dueBefore === undefined) return all;
    if (!isCalendarDate(dueBefore)) throw invalidDueDate();
    return all.filter((task) => task.dueDate !== null && task.dueDate < dueBefore);
  }

  get(id: string): Task {
    const task = this.tasks.get(id);
    if (!task) throw new ApiError(404, "not_found", "task not found");
    return task;
  }

  create(body: Body): Task {
    if (!validTitle(body.title)) throw invalidTitle();
    const dueDate = dueDateOf(body.dueDate);
    const task: Task = {
      id: randomUUID(),
      title: body.title.trim(),
      done: body.done === true,
      dueDate,
    };
    this.tasks.set(task.id, task);
    return task;
  }

  update(id: string, body: Body): Task {
    const task = this.get(id);
    if ("title" in body && !validTitle(body.title)) throw invalidTitle();
    const dueDate = "dueDate" in body ? dueDateOf(body.dueDate) : task.dueDate;
    if (typeof body.title === "string") task.title = body.title.trim();
    if (typeof body.done === "boolean") task.done = body.done;
    task.dueDate = dueDate;
    return task;
  }
}
