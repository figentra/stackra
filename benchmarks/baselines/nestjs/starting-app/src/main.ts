import { NestFactory } from "@nestjs/core";

import { ApiErrorFilter } from "./api-error.filter.js";
import { AppModule } from "./app.module.js";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: ["error"] });
  app.useGlobalFilters(new ApiErrorFilter());
  await app.listen(Number(process.env.PORT));
}

void bootstrap();
