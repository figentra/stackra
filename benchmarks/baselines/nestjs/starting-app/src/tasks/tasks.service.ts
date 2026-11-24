import { randomUUID } from "node:crypto";

import { Injectable } from "@nestjs/common";

import { ApiError } from "../api-error";

export interface Task {
  id: string;
  title: string;
  done: boolean;
}

type Body = Record<string, unknown>;

const validTitle = (title: unknown): title is string =>
  typeof title === "string" && title.trim().length >= 1 && title.trim().length <= 120;

function invalidTitle(): ApiError {
  return new ApiError(400, "invalid_title", "title is 1 to 120 characters");
}

@Injectable()
export class TasksService {
  private readonly tasks = new Map<string, Task>();

  list(): Task[] {
    return [...this.tasks.values()];
  }

  get(id: string): Task {
    const task = this.tasks.get(id);
    if (!task) throw new ApiError(404, "not_found", "task not found");
    return task;
  }

  create(body: Body): Task {
    if (!validTitle(body.title)) throw invalidTitle();
    const task: Task = { id: randomUUID(), title: body.title.trim(), done: body.done === true };
    this.tasks.set(task.id, task);
    return task;
  }

  update(id: string, body: Body): Task {
    const task = this.get(id);
    if ("title" in body && !validTitle(body.title)) throw invalidTitle();
    if (typeof body.title === "string") task.title = body.title.trim();
    if (typeof body.done === "boolean") task.done = body.done;
    return task;
  }
}
