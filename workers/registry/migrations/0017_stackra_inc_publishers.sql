-- Stackra file contract:
-- Purpose: the seventeenth D1 migration of the Stackra registry: the Stackra repositories moved from the figentra
--          organization to stackra-inc (STA-2806), so the trusted publishers of `@stackra` and `@stackra-pro` follow
--          them. A transfer keeps each repository's id; the name and the owner id change, and the registry matches
--          all three (ADR 0453 decision 6), so without this no release publishes.
-- Boundary: two row updates, no schema change; the scopes, workflow, ref and environment stay as 0001 set them.
--           Applied by CI with `wrangler d1 migrations apply`; never edited once applied.
-- Runtime: Cloudflare D1 (SQLite)
-- Governing contract: ADR 0453 (decision 6).

-- Repository ids from the GitHub API, unchanged by the transfer; stackra-inc = 277548342.
UPDATE publishers SET repository = 'stackra-inc/stackra', repository_owner_id = '277548342'
  WHERE scope = '@stackra' AND repository_id = '1425140001';
UPDATE publishers SET repository = 'stackra-inc/stackra-pro', repository_owner_id = '277548342'
  WHERE scope = '@stackra-pro' AND repository_id = '1435812554';
