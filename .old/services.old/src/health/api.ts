import { api } from "encore.dev/api";

interface HealthResponse {
  status: "ok";
}

// Public on purpose: load balancers and uptime checks call it without credentials.
export const check = api(
  { expose: true, auth: false, method: "GET", path: "/health" },
  async (): Promise<HealthResponse> => ({ status: "ok" }),
);
