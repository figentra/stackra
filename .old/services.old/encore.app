{
  "$schema": "https://encore.dev/schemas/appfile.schema.json",
  "id": "",
  "lang": "typescript",
  "global_cors": {
    "allow_headers": ["Idempotency-Key", "X-Scope-Path", "X-Request-Id"],
    "expose_headers": ["X-Request-Id"],
    "allow_origins_with_credentials": ["http://localhost:3700"]
  }
}
