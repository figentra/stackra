import { api } from "encore.dev/api";

interface StatusResponse {
  service: "{{NAME}}";
  status: "ok";
}

// Public until identity's authHandler exists; every real endpoint defaults to `auth: true`.
export const status = api(
  { expose: true, auth: false, method: "GET", path: "/{{NAME}}/status" },
  async (): Promise<StatusResponse> => ({ service: "{{NAME}}", status: "ok" }),
);
