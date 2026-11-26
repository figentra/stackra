import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from "@nestjs/common";
import type { Response } from "express";

import { ApiError } from "./api-error.js";

@Catch()
export class ApiErrorFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const { status, code, message } = describe(exception);
    response.status(status).json({ error: { code, message } });
  }
}

function describe(exception: unknown): { status: number; code: string; message: string } {
  if (exception instanceof ApiError) {
    return { status: exception.getStatus(), code: exception.code, message: exception.message };
  }
  const status = statusOf(exception);
  if (status === 404) return { status, code: "not_found", message: "not found" };
  if (status === 400) {
    return { status, code: "invalid_json", message: "the body is not a JSON object" };
  }
  return { status: 500, code: "internal_error", message: "internal error" };
}

function statusOf(exception: unknown): number {
  if (exception instanceof HttpException) return exception.getStatus();
  const candidate = exception as { status?: unknown; statusCode?: unknown };
  const status = candidate.status ?? candidate.statusCode;
  return typeof status === "number" ? status : 500;
}
