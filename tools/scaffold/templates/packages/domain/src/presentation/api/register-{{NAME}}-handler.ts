import { register{{PASCAL}}, type {{PASCAL}}Repository } from "#application";

export interface Register{{PASCAL}}Request {
  readonly id: string;
  readonly label: string;
}

export interface Register{{PASCAL}}Response {
  readonly id: string;
  readonly label: string;
}

/**
 * A thin handler over `register{{PASCAL}}`: maps the request to the command and the record to the response.
 * The host (a service's `api()` endpoint) passes the adapter in — presentation never imports infrastructure.
 */
export function createRegister{{PASCAL}}Handler(repository: {{PASCAL}}Repository) {
  return async (request: Register{{PASCAL}}Request): Promise<Register{{PASCAL}}Response> => {
    const record = await register{{PASCAL}}({ id: request.id, label: request.label }, repository);
    return { id: record.id, label: record.label };
  };
}
