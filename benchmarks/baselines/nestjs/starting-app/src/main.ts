import { NestFactory } from "@nestjs/core";

import { ApiErrorFilter } from "./api-error.filter";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: ["error"] });
  app.useGlobalFilters(new ApiErrorFilter());
  await app.listen(Number(process.env.PORT));
}

void bootstrap();
