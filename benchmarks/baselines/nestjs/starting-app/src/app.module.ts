import { Module } from "@nestjs/common";

import { TasksController } from "./tasks/tasks.controller.js";
import { TasksService } from "./tasks/tasks.service.js";

@Module({
  controllers: [TasksController],
  providers: [TasksService],
})
export class AppModule {}
