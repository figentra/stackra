import { Body, Controller, Get, HttpCode, Param, Patch, Post } from "@nestjs/common";

import { ApiError } from "../api-error.js";
import { TasksService } from "./tasks.service.js";

function asObject(body: unknown): Record<string, unknown> {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    throw new ApiError(400, "invalid_json", "the body is not a JSON object");
  }
  return body as Record<string, unknown>;
}

@Controller("tasks")
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Get()
  list() {
    return { items: this.tasks.list() };
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.tasks.get(id);
  }

  @Post()
  @HttpCode(201)
  create(@Body() body: unknown) {
    return this.tasks.create(asObject(body ?? {}));
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: unknown) {
    return this.tasks.update(id, asObject(body ?? {}));
  }
}
