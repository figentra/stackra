import { api, APIError } from "encore.dev/api";
import { health } from "~encore/clients";

interface HelloRequest {
  name: string;
}
interface HelloResponse {
  message: string;
  upstream: "ok";
}

// Example only — public until identity's authHandler exists; real endpoints default to `auth: true`.
// Shows a typed request/response, a stable APIError, and a cross-service call through ~encore/clients.
export const hello = api(
  { expose: true, auth: false, method: "GET", path: "/example/hello/:name" },
  async ({ name }: HelloRequest): Promise<HelloResponse> => {
    const trimmed = name.trim();
    if (!trimmed) throw APIError.invalidArgument("name is required");
    const { status } = await health.check();
    return { message: `Hello, ${trimmed}!`, upstream: status };
  },
);
